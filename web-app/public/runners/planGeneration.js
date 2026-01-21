// Background Runner for Plan Generation
// This runs in a headless environment, separate from the main WebView
// 
// TODO: 后端 API 集成
// 当后端准备好后，替换模拟逻辑为真实的 HTTP 请求

console.log('🚀 Plan Generation Runner loaded');

// 15秒倒计时任务
var TOTAL_SECONDS = 15;

addEventListener('generatePlan', function (resolve, reject, args) {
    console.log('📝 Starting 15-second plan generation task');

    var startTime = Date.now();
    var remainingSeconds = TOTAL_SECONDS;

    // 立即发送开始通知
    try {
        CapacitorNotifications.schedule([{
            id: 100,
            title: '正在生成计划 (' + TOTAL_SECONDS + '秒)',
            body: '任务开始，请稍候...',
            ongoing: true,
            autoCancel: false
        }]);
        console.log('📨 Started notification shown');
    } catch (err) {
        console.error('Failed to show start notification:', err);
    }

    // 每3秒更新一次通知显示剩余时间
    var updateInterval = setInterval(function () {
        var elapsed = Math.floor((Date.now() - startTime) / 1000);
        remainingSeconds = Math.max(TOTAL_SECONDS - elapsed, 0);

        console.log('⏱️ Remaining: ' + remainingSeconds + ' seconds');

        try {
            CapacitorNotifications.schedule([{
                id: 100,
                title: '正在生成计划',
                body: '剩余 ' + remainingSeconds + ' 秒...',
                ongoing: true,
                autoCancel: false
            }]);
        } catch (err) {
            console.warn('Update notification error:', err);
        }

        if (remainingSeconds <= 0) {
            clearInterval(updateInterval);
        }
    }, 3000);

    // 15秒后完成任务
    setTimeout(function () {
        clearInterval(updateInterval);

        console.log('✅ Plan generation completed after 15 seconds');

        try {
            // 发送完成通知
            CapacitorNotifications.schedule([{
                id: 1,
                title: '🎉 专属计划已生成！',
                body: '15秒任务完成，点击查看 Cooper 的营养计划',
                ongoing: false,
                autoCancel: true,
                extra: {
                    route: '/plan/summary'
                }
            }]);

            // 清除进度通知
            CapacitorNotifications.schedule([{
                id: 100,
                title: '计划生成完成',
                body: '点击查看详情',
                ongoing: false,
                autoCancel: true
            }]);

            console.log('📨 Completion notification sent!');

            resolve({
                success: true,
                duration: TOTAL_SECONDS,
                completedAt: new Date().toISOString()
            });

        } catch (err) {
            console.error('❌ Error sending completion notification:', err);
            reject(err);
        }

    }, TOTAL_SECONDS * 1000);
});

console.log('✅ Event listener registered for generatePlan (15-second task)');
