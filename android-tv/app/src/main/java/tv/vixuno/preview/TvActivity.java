package tv.vixuno.preview;

import android.app.Activity;
import android.os.Bundle;
import android.net.Uri;
import android.content.Intent;
import android.view.View;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.Toast;

/** Contenedor Android de pruebas. Solo permite el servidor local redirigido con adb. */
public final class TvActivity extends Activity {
    private WebView web;
    private FrameLayout root;
    private View fullScreen;
    private WebChromeClient.CustomViewCallback fullScreenCallback;
    private static final String BASE = "http://127.0.0.1:8088/?tv=1";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        root=new FrameLayout(this);web=new WebView(this);root.addView(web);setContentView(root);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.getSettings().setMediaPlaybackRequiresUserGesture(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri u=request.getUrl();
                if("http".equals(u.getScheme())&&"127.0.0.1".equals(u.getHost())&&u.getPort()==8088)return false;
                if(request.hasGesture()&&"https".equals(u.getScheme()))startActivity(new Intent(Intent.ACTION_VIEW,u));
                return true;
            }
            @Override public void onReceivedError(WebView v,WebResourceRequest r,WebResourceError e){if(r.isForMainFrame())Toast.makeText(TvActivity.this,"No se puede conectar. Comprueba el servidor y adb reverse.",Toast.LENGTH_LONG).show();}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onShowCustomView(View view,CustomViewCallback callback){
                if(fullScreen!=null){callback.onCustomViewHidden();return;}
                fullScreen=view;fullScreenCallback=callback;web.setVisibility(View.GONE);root.addView(view,new FrameLayout.LayoutParams(-1,-1));getWindow().getDecorView().setSystemUiVisibility(5894);
            }
            @Override public void onHideCustomView(){hideFullScreen();}
        });
        web.loadUrl(BASE);web.requestFocus();
    }
    private void hideFullScreen(){if(fullScreen==null)return;root.removeView(fullScreen);fullScreen=null;web.setVisibility(View.VISIBLE);getWindow().getDecorView().setSystemUiVisibility(0);if(fullScreenCallback!=null)fullScreenCallback.onCustomViewHidden();fullScreenCallback=null;web.requestFocus();}
    @Override public void onBackPressed(){if(fullScreen!=null){hideFullScreen();return;}web.evaluateJavascript("Boolean(window.VixunoTVBack && window.VixunoTVBack())",value->{if(!"true".equals(value)){if(web.canGoBack())web.goBack();else finish();}});}
    @Override protected void onPause(){web.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
