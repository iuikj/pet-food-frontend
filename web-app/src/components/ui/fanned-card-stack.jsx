'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable);
}

function getItemKey(item) {
  return item?.id ?? JSON.stringify(item);
}

function getKeySignature(items) {
  return JSON.stringify(items.map((item) => getItemKey(item)));
}

function areSameItems(a, b) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function reconcileItems(currentItems, incomingItems, { contentOnly = false } = {}) {
  const incomingByKey = new Map(incomingItems.map((item) => [getItemKey(item), item]));
  const currentKeys = currentItems.map(getItemKey);
  const incomingKeys = incomingItems.map(getItemKey);
  const incomingKeySet = new Set(incomingKeys);
  const currentKeySet = new Set(currentKeys);
  const isStructuralChange = (
    currentKeys.length !== incomingKeys.length ||
    currentKeys.some((key) => !incomingKeySet.has(key)) ||
    incomingKeys.some((key) => !currentKeySet.has(key))
  );

  if (contentOnly) {
    const nextItems = currentItems.map((item) => incomingByKey.get(getItemKey(item)) ?? item);
    return {
      items: areSameItems(currentItems, nextItems) ? currentItems : nextItems,
      isStructuralChange,
    };
  }

  const nextItems = currentItems
    .filter((item) => incomingKeySet.has(getItemKey(item)))
    .map((item) => incomingByKey.get(getItemKey(item)) ?? item);
  const nextKeySet = new Set(nextItems.map(getItemKey));

  incomingItems.forEach((item) => {
    if (!nextKeySet.has(getItemKey(item))) {
      nextItems.push(item);
    }
  });

  return {
    items: areSameItems(currentItems, nextItems) ? currentItems : nextItems,
    isStructuralChange,
  };
}

/**
 * Renders a stack of items as fanned-out cards.
 * Users can drag the top card to "swipe" it to the bottom of the stack.
 *
 * Source: satisui FannedCardStack (https://satisui.xyz/docs/carousels/fanned-card-stack).
 * Project patches are tagged with `// PATCH:` — keep them when re-syncing upstream.
 */
export function FannedCardStack(
  {
    items: initialItems,
    renderItem,
    rotateFactor = 4,
    scaleFactor = 0.05,
    pivot = { x: 50, y: 100 },
    onReorder,
    className
  }
) {
  const [items, setItems] = React.useState(initialItems || []);
  const cardRefs = React.useRef([]);
  const itemsRef = React.useRef(items);
  const onReorderRef = React.useRef(onReorder);
  const pendingStructuralItems = React.useRef(null);
  const isAnimating = React.useRef(false);
  const isDragging = React.useRef(false);
  const hasLoaded = React.useRef(false);
  const pivotX = pivot?.x ?? 50;
  const pivotY = pivot?.y ?? 100;
  const itemKeySignature = React.useMemo(() => getKeySignature(items), [items]);

  React.useEffect(() => {
    itemsRef.current = items;
    cardRefs.current.length = items.length;
  }, [items]);

  React.useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  const getCardStyle = React.useCallback((index, itemCount = itemsRef.current.length) => {
    return {
      rotation: index * rotateFactor,
      scale: 1 - index * scaleFactor,
      zIndex: itemCount - index,
      x: 0,
      y: 0,
      opacity: 1,
    };
  }, [rotateFactor, scaleFactor]);

  const consumePendingStructuralItems = React.useCallback((baseItems = itemsRef.current) => {
    if (!pendingStructuralItems.current) return baseItems;

    const pendingItems = pendingStructuralItems.current;
    pendingStructuralItems.current = null;
    const { items: nextItems } = reconcileItems(baseItems, pendingItems);
    return nextItems;
  }, []);

  React.useEffect(() => {
    const incomingItems = initialItems || [];

    setItems((currentItems) => {
      const { isStructuralChange } = reconcileItems(currentItems, incomingItems);

      if (isStructuralChange && (isDragging.current || isAnimating.current)) {
        pendingStructuralItems.current = incomingItems;
        const { items: contentOnlyItems } = reconcileItems(currentItems, incomingItems, {
          contentOnly: true,
        });
        itemsRef.current = contentOnlyItems;
        return contentOnlyItems;
      }

      pendingStructuralItems.current = null;
      const { items: nextItems } = reconcileItems(currentItems, incomingItems);
      itemsRef.current = nextItems;
      return nextItems;
    });
  }, [initialItems]);

  useGSAP(() => {
    const currentItems = itemsRef.current;
    const itemCount = currentItems.length;

    // DECISION: We split logic into "Entrance" (initial load) and "Maintenance" (re-renders).
    // The entrance ensures a clean 'deal' animation, while maintenance updates positions instantly
    // to keep the stack visually consistent during React state updates.
    if (!hasLoaded.current) {
      currentItems.forEach((_, index) => {
        const el = cardRefs.current[index];
        if (el) {
          gsap.set(el, {
            transformOrigin: `${pivotX}% ${pivotY}%`,
            rotation: 0,
            x: 0,
            y: 50,
            scale: 0.9,
            opacity: 0,
            zIndex: itemCount - index,
          });
        }
      });

      gsap.to(cardRefs.current, {
        rotation: (i) => getCardStyle(i, itemCount).rotation,
        scale: (i) => getCardStyle(i, itemCount).scale,
        y: 0,
        x: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.08,
        ease: 'back.out(1.2)',
        onComplete: () => {
          hasLoaded.current = true;
        },
      });
    } else {
      currentItems.forEach((_, index) => {
        const el = cardRefs.current[index];
        if (!el) return;
        const style = getCardStyle(index, itemCount);

        gsap.set(el, {
          transformOrigin: `${pivotX}% ${pivotY}%`,
          rotation: style.rotation,
          scale: style.scale,
          x: 0,
          y: 0,
          zIndex: style.zIndex,
          opacity: 1,
          overwrite: 'auto',
        });
      });
    }

    const topCard = cardRefs.current[0];
    if (!topCard) return;

    const draggable = Draggable.create(topCard, {
      type: 'x,y',
      zIndexBoost: false,
      onPress: function () {
        if (isAnimating.current) {
          this.endDrag();
          return;
        }
        isDragging.current = true;
        // STOP: Kill any ongoing "snap back" animations if the user grabs the card mid-air.
        gsap.killTweensOf(this.target);
      },
      onRelease: function () {
        const dist = Math.sqrt(this.x * this.x + this.y * this.y);
        const THRESHOLD = 60;

        if (dist > THRESHOLD) {
          isAnimating.current = true;
          const currentItems = itemsRef.current;
          const lastIndex = currentItems.length - 1;
          const targetStyle = getCardStyle(lastIndex, currentItems.length);
          // HACK: Multiply the drag distance to create a visual "kick" or momentum effect
          // before the card loops back to the bottom of the stack.
          const kickX = this.x * 1.5;
          const kickY = this.y * 1.5;

          const timeline = gsap.timeline({
            onComplete: () => {
              const newItems = [...itemsRef.current];
              const movedItem = newItems.shift();
              if (movedItem) newItems.push(movedItem);
              isAnimating.current = false;
              isDragging.current = false;
              const settledItems = consumePendingStructuralItems(newItems);
              itemsRef.current = settledItems;
              setItems(settledItems);
              if (onReorderRef.current) onReorderRef.current(settledItems);
            },
          });

          // Choreography: Throw card out -> Move to back (z-index) -> Slide back into stack
          timeline
            .to(this.target, {
              x: kickX,
              y: kickY,
              scale: 0.8,
              duration: 0.2,
              ease: 'power1.out',
            })
            .set(this.target, { zIndex: 0 })
            .to(this.target, {
              x: 0,
              y: 0,
              rotation: targetStyle.rotation,
              scale: targetStyle.scale,
              duration: 0.5,
              ease: 'back.out(1.2)',
            });

          currentItems.forEach((_, i) => {
            if (i === 0) return;
            const el = cardRefs.current[i];
            const nextStyle = getCardStyle(i - 1, currentItems.length);
            timeline.to(el, {
              rotation: nextStyle.rotation,
              scale: nextStyle.scale,
              duration: 0.5,
              ease: 'power2.out',
            }, 0.15);
          });
        } else {
          gsap.to(this.target, {
            x: 0,
            y: 0,
            duration: 0.4,
            ease: 'back.out(1.5)',
            onComplete: () => {
              isDragging.current = false;
              const settledItems = consumePendingStructuralItems();
              if (settledItems !== itemsRef.current) {
                itemsRef.current = settledItems;
                setItems(settledItems);
              }
            },
          });
        }
      },
    })[0];

    return () => {
      draggable.kill();
    };
  }, [itemKeySignature, rotateFactor, scaleFactor, pivotX, pivotY, getCardStyle, consumePendingStructuralItems]);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        'aspect-[3/4] w-64',
        className
      )}>
      {items.map((item, index) => {
        return (
          <div
            // PATCH 2: 项目特化 — 优先用 item.id 作为 key，避免 events 实时更新触发整组 unmount + entrance animation 重放
            // 由消费方保证 card.id 稳定（grill #7 ADR-001 风险落地）；fallback 到 JSON.stringify 兼容上游契约
            key={item?.id ?? JSON.stringify(item)}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-card text-card-foreground border border-border shadow-xl',
              'rounded-2xl',
              // HACK: Prevent FOUC (Flash of Unstyled Content) by starting opacity-0.
              // GSAP handles the fade-in during the initial entrance animation.
              'opacity-0',
              index === 0
                ? 'cursor-grab active:cursor-grabbing'
                : 'pointer-events-none'
            )}
            style={{
              zIndex: items.length - index,
            }}>
            <div
              // PATCH: removed pointer-events-none on inner wrapper to let renderItem onClick through (project-specific)
              className='h-full w-full overflow-hidden rounded-2xl select-none'>
              {renderItem(item, index)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
