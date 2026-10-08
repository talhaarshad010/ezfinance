package com.ezfinance.splash

import android.app.Activity
import android.graphics.Color
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.core.view.WindowCompat
import java.lang.ref.WeakReference

/**
 * Native animated splash that sits on top of the React view while JS loads.
 *
 * Sequence: logo draws itself → holds → splits into ribbons that rush past the
 * viewer (Netflix-style) → overlay fades out.
 * The fade-out waits for BOTH the animation and [markAppReady] (called from JS
 * once the first screen has rendered), so there is never a blank gap or a
 * second, JS-rendered splash.
 */
object SplashOverlay {

  private const val BACKGROUND = "#F9FAFB" // matches the launch window + onboarding (light)
  private const val INK = "#0D0D0E"
  private const val FADE_MS = 320L
  private const val MAX_LOGO_WIDTH_DP = 340f
  /** Safety net: never keep the overlay up longer than this, even if JS never reports ready. */
  private const val MAX_WAIT_MS = 12_000L

  private var containerRef: WeakReference<FrameLayout>? = null
  private var animationDone = false
  private var appReady = false

  fun show(activity: Activity) {
    if (containerRef?.get() != null) return
    animationDone = false
    appReady = false

    val density = activity.resources.displayMetrics.density
    val screenW = activity.resources.displayMetrics.widthPixels
    val logoW = minOf(screenW * 0.78f, MAX_LOGO_WIDTH_DP * density)

    val container =
        FrameLayout(activity).apply {
          setBackgroundColor(Color.parseColor(BACKGROUND))
          isClickable = true // swallow touches while the splash is up
        }
    val logo =
        LogoDrawView(activity).apply {
          strokeColor = Color.parseColor(INK)
          logoWidthPx = logoW
          // Full screen, so the splitting ribbons can fly past the edges.
          layoutParams =
              FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }
    container.addView(logo)

    activity.addContentView(
        container,
        ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    containerRef = WeakReference(container)

    // Dark status-bar icons on the light splash.
    WindowCompat.getInsetsController(activity.window, activity.window.decorView).isAppearanceLightStatusBars = true

    logo.onFinished = {
      animationDone = true
      maybeDismiss()
    }
    logo.start()

    container.postDelayed(
        {
          if (containerRef?.get() !== container) return@postDelayed
          animationDone = true
          appReady = true
          maybeDismiss()
        },
        MAX_WAIT_MS)
  }

  /** JS has rendered its first screen. */
  fun markAppReady() {
    val container = containerRef?.get() ?: return
    container.post {
      appReady = true
      maybeDismiss()
    }
  }

  private fun maybeDismiss() {
    if (!animationDone || !appReady) return
    val container = containerRef?.get() ?: return
    containerRef = null
    container
        .animate()
        .alpha(0f)
        .setDuration(FADE_MS)
        .withEndAction { (container.parent as? ViewGroup)?.removeView(container) }
        .start()
  }
}
