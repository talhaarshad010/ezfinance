package com.ezfinance.splash

import android.app.Activity
import android.graphics.Color
import android.view.Gravity
import android.view.ViewGroup
import android.view.animation.PathInterpolator
import android.widget.FrameLayout
import androidx.core.view.WindowCompat
import java.lang.ref.WeakReference

/**
 * Native animated splash that sits on top of the React view while JS loads.
 *
 * Sequence: logo draws itself → holds → shrinks, rises and dims → fades out.
 * The fade-out waits for BOTH the animation and [markAppReady] (called from JS
 * once the first screen has rendered), so there is never a blank gap or a
 * second, JS-rendered splash.
 */
object SplashOverlay {

  private const val BACKGROUND = "#F9FAFB" // matches the launch window + onboarding (light)
  private const val INK = "#0D0D0E"
  private const val HOLD_MS = 600L
  private const val SETTLE_MS = 800L
  private const val FADE_MS = 320L
  private const val SETTLED_SCALE = 0.45f
  private const val SETTLED_CENTER_Y = 0.16f
  private const val SETTLED_ALPHA = 0.75f
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
    val logoW = minOf(screenW * 0.78f, MAX_LOGO_WIDTH_DP * density).toInt()

    val container =
        FrameLayout(activity).apply {
          setBackgroundColor(Color.parseColor(BACKGROUND))
          isClickable = true // swallow touches while the splash is up
        }
    val logo =
        LogoDrawView(activity).apply {
          strokeColor = Color.parseColor(INK)
          layoutParams = FrameLayout.LayoutParams(logoW, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        }
    container.addView(logo)

    activity.addContentView(
        container,
        ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    containerRef = WeakReference(container)

    // Dark status-bar icons on the light splash.
    WindowCompat.getInsetsController(activity.window, activity.window.decorView).isAppearanceLightStatusBars = true

    logo.onDrawn = {
      logo.postDelayed(
          {
            val rise = container.height * (0.5f - SETTLED_CENTER_Y)
            logo
                .animate()
                .scaleX(SETTLED_SCALE)
                .scaleY(SETTLED_SCALE)
                .translationY(-rise)
                .alpha(SETTLED_ALPHA)
                .setDuration(SETTLE_MS)
                .setInterpolator(PathInterpolator(0.65f, 0f, 0.35f, 1f))
                .withEndAction {
                  animationDone = true
                  maybeDismiss()
                }
                .start()
          },
          HOLD_MS)
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
