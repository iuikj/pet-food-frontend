'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable);
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
  const [items, setItems] = React.useState(initialItems);
  const cardRefs = React.useRef([]);
  const isAnimating = React.useRef(false);
  const hasLoaded = React.useRef(false);

  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const getCardStyle = React.useCallback((index) => {
    return {
      rotation: index * rotateFactor,
      scale: 1 - index * scaleFactor,
      zIndex: items.length - index,
      x: 0,
      y: 0,
      opacity: 1,
    };
  }, [items.length, rotateFactor, scaleFactor]);

  useGSAP(() => {
    // DECISION: We split logic into "Entrance" (initial load) and "Maintenance" (re-renders).
    // The entrance ensures a clean 'deal' animation, while maintenance updates positions instantly
    // to keep the stack visually consistent during React state updates.
    if (!hasLoaded.current) {
      items.forEach((_, index) => {
        const el = cardRefs.current[index];
        if (el) {
          gsap.set(el, {
            transformOrigin: `${pivot.x}% ${pivot.y}%`,
            rotation: 0,
            x: 0,
            y: 50,
            scale: 0.9,
            opacity: 0,
            zIndex: items.length - index,
          });
        }
      });

      gsap.to(cardRefs.current, {
        rotation: (i) => getCardStyle(i).rotation,
        scale: (i) => getCardStyle(i).scale,
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
      items.forEach((_, index) => {
        const el = cardRefs.current[index];
        if (!el) return;
        const style = getCardStyle(index);

        gsap.set(el, {
          transformOrigin: `${pivot.x}% ${pivot.y}%`,
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
        // STOP: Kill any ongoing "snap back" animations if the user grabs the card mid-air.
        gsap.killTweensOf(this.target);
      },
      onRelease: function () {
        const dist = Math.sqrt(this.x * this.x + this.y * this.y);
        const THRESHOLD = 60;

        if (dist > THRESHOLD) {
          isAnimating.current = true;
          const lastIndex = items.length - 1;
          const targetStyle = getCardStyle(lastIndex);
          // HACK: Multiply the drag distance to create a visual "kick" or momentum effect
          // before the card loops back to the bottom of the stack.
          const kickX = this.x * 1.5;
          const kickY = this.y * 1.5;

          const timeline = gsap.timeline({
            onComplete: () => {
              const newItems = [...items];
              const movedItem = newItems.shift();
              if (movedItem) newItems.push(movedItem);
              setItems(newItems);
              if (onReorder) onReorder(newItems);
              isAnimating.current = false;
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

          items.forEach((_, i) => {
            if (i === 0) return;
            const el = cardRefs.current[i];
            const nextStyle = getCardStyle(i - 1);
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
          });
        }
      },
    })[0];

    return () => {
      draggable.kill();
    };
  }, [items, rotateFactor, scaleFactor, pivot]);

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
            key={JSON.stringify(item)}
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
