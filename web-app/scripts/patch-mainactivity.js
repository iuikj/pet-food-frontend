#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const mainActivityPath = path.join(__dirname, '../android/app/src/main/java/com/petcare/app/MainActivity.java');

const content = `package com.petcare.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            // 隐藏原生竖向/横向滚动条（CSS 管不到这一层）
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            // 关闭顶/底过度滚动的蓝色发光圈，去掉"网页感"
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        }
    }
}
`;

try {
    fs.writeFileSync(mainActivityPath, content, 'utf8');
    console.log('✅ MainActivity.java patched successfully');
} catch (err) {
    console.error('❌ Failed to patch MainActivity.java:', err.message);
    process.exit(1);
}
