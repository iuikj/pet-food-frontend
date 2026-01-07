// Background Runner for Plan Generation
// This runs in a headless environment, separate from the main WebView

console.log('🚀 Plan Generation Runner loaded');

// Listen for plan generation events
addEventListener('generatePlan', (resolve, reject, args) => {
    console.log('📝 Starting plan generation in background');
    console.log('Received args:', JSON.stringify(args));

    const DURATION = args.duration || 15000; // Default 15 seconds
    const startTime = Date.now();

    // Simulate generation progress (optional - for logging)
    const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / DURATION) * 100, 100);
        console.log(`Progress: ${progress.toFixed(0)}%`);

        if (elapsed >= DURATION) {
            clearInterval(progressInterval);
        }
    }, 3000); // Log every 3 seconds

    // Main task: wait for duration then send notification
    setTimeout(() => {
        try {
            console.log('✅ Plan generation completed');

            // Schedule notification
            CapacitorNotifications.schedule([{
                id: 1,
                title: '专属计划已生成 🎉',
                body: 'Cooper 的营养计划已准备就绪，点击查看详情。',
                extra: {
                    route: '/plan/summary'
                }
            }]);

            console.log('📨 Notification scheduled');

            // Resolve the task
            resolve({
                success: true,
                completedAt: new Date().toISOString()
            });

        } catch (err) {
            console.error('❌ Error in runner:', err);
            reject(err);
        }
    }, DURATION);
});

console.log('✅ Event listener registered for generatePlan');
