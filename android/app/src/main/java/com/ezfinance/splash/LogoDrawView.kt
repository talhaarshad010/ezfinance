package com.ezfinance.splash

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PathMeasure
import android.graphics.RectF
import android.view.View
import android.view.animation.LinearInterpolator
import android.view.animation.PathInterpolator

/**
 * The ezFinance mark drawing itself stroke by stroke, then splitting into
 * lines that rush past the viewer (Netflix-style), in a single ink colour. Native port of the JS
 * `LogoDrawAnimation` — keep the timings in both files in sync.
 *
 * The view fills the screen so the expanding ribbons are never clipped; the
 * mark itself is drawn [logoWidthPx] wide, centred.
 */
class LogoDrawView(context: Context) : View(context) {

  private class Stroke(val path: Path, val startMs: Long, val durMs: Long) {
    val measure = PathMeasure(path, false)
    val length = measure.length
    val partial = Path()
  }

  private class Layer(val radius: Float, val strokes: List<Stroke>)

  private data class Track(val r: Float, val wave: (Path) -> Unit)

  var logoWidthPx: Float = 0f
  var strokeColor: Int = Color.parseColor("#0D0D0E")

  /** Called once the split has played out and the screen is clear. */
  var onFinished: (() -> Unit)? = null

  private val paint =
      Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        strokeWidth = STROKE_WIDTH
      }

  private val drawEasing = PathInterpolator(0.45f, 0f, 0.25f, 1f)
  private val splitEasing = PathInterpolator(0.55f, 0f, 0.85f, 0.35f)
  private val layers: List<Layer> = buildLayers()
  private var clockMs = 0L
  private var animator: ValueAnimator? = null

  fun start() {
    animator?.cancel()
    animator =
        ValueAnimator.ofFloat(0f, TOTAL_MS.toFloat()).apply {
          duration = TOTAL_MS
          interpolator = LinearInterpolator()
          addUpdateListener {
            clockMs = (it.animatedValue as Float).toLong()
            invalidate()
          }
          addListener(
              object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                  clockMs = TOTAL_MS
                  invalidate()
                  onFinished?.invoke()
                }
              })
          start()
        }
  }

  override fun onDetachedFromWindow() {
    animator?.cancel()
    super.onDetachedFromWindow()
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    if (logoWidthPx <= 0f) return

    // Map the SVG viewBox so the mark is logoWidthPx wide and centred on screen.
    val k = logoWidthPx / VIEWBOX_W
    canvas.save()
    canvas.translate(width / 2f, height / 2f)
    canvas.scale(k, k)
    canvas.translate(-(VIEWBOX_X + VIEWBOX_W / 2f), -(VIEWBOX_Y + VIEWBOX_H / 2f))

    val split = ((clockMs - DRAW_MS - HOLD_MS).toFloat() / SPLIT_MS).coerceIn(0f, 1f)

    layers.forEachIndexed { li, layer ->
      val s0 = li * SPLIT_STAGGER
      val local = ((split - s0) / SPLIT_SPAN).coerceIn(0f, 1f)
      val scale = 1f + (SPLIT_SCALE + li * SPLIT_SCALE_PER_LAYER) * splitEasing.getInterpolation(local)
      val alpha = if (local <= 0.45f) 1f else (1f - (local - 0.45f) / 0.55f).coerceIn(0f, 1f)
      if (alpha <= 0f) return@forEachIndexed
      paint.color = strokeColor
      paint.alpha = (alpha * 255).toInt()

      // Scale about the mark's "eye" (the rings' centre).
      canvas.save()
      canvas.scale(scale, scale, CX, CY)
      for (s in layer.strokes) {
        val linear = ((clockMs - s.startMs).toFloat() / s.durMs).coerceIn(0f, 1f)
        if (linear <= 0f) continue
        val progress = drawEasing.getInterpolation(linear)
        if (progress >= 1f) {
          canvas.drawPath(s.path, paint)
        } else {
          s.partial.reset()
          s.measure.getSegment(0f, s.length * progress, s.partial, true)
          canvas.drawPath(s.partial, paint)
        }
      }
      canvas.restore()
    }
    canvas.restore()
  }

  private fun buildLayers(): List<Layer> {
    val list = mutableListOf<Layer>()

    // Tracks (outer drawn first): half-stadium grows out of its bottom-left
    // point (bottom line + arc/top line together); wave tail draws after the rings.
    TRACKS.reversed().forEachIndexed { i, t ->
      val yb = CY + t.r
      val yt = CY - t.r
      val start = TRACK_START + i * TRACK_STAGGER
      list +=
          Layer(
              t.r,
              listOf(
                  Stroke(Path().apply { moveTo(340f, yb); lineTo(TRACK_RIGHT, yb) }, start, TRACK_DUR),
                  Stroke(
                      Path().apply {
                        moveTo(340f, yb)
                        arcTo(RectF(340f - t.r, CY - t.r, 340f + t.r, CY + t.r), 90f, 180f, false)
                        lineTo(TRACK_RIGHT, yt)
                      },
                      start,
                      TRACK_DUR),
                  Stroke(
                      Path().apply {
                        moveTo(TRACK_RIGHT, yt)
                        t.wave(this)
                      },
                      WAVE_START + i * WAVE_STAGGER,
                      WAVE_DUR),
              ))
    }

    // Centre circle: two halves rising from the bottom point.
    val core = RectF(CX - CORE_R, CY - CORE_R, CX + CORE_R, CY + CORE_R)
    list +=
        Layer(
            CORE_R,
            listOf(
                Stroke(Path().apply { moveTo(CX, CY + CORE_R); arcTo(core, 90f, 180f, false) }, CORE_START, CORE_DUR),
                Stroke(Path().apply { moveTo(CX, CY + CORE_R); arcTo(core, 90f, -180f, false) }, CORE_START, CORE_DUR),
            ))

    // Rings: full circles drawn clockwise from the lower-left, outer to inner.
    RINGS.forEachIndexed { i, r ->
      val rect = RectF(CX - r, CY - r, CX + r, CY + r)
      list +=
          Layer(
              r,
              listOf(
                  Stroke(
                      Path().apply {
                        arcTo(rect, 120f, 180f, true)
                        arcTo(rect, 300f, 180f, false)
                      },
                      RING_START + i * RING_STAGGER,
                      RING_DUR)))
    }

    // Split order: inner layers first.
    return list.sortedBy { it.radius }
  }

  companion object {
    const val VIEWBOX_X = 185f
    const val VIEWBOX_Y = 320f
    const val VIEWBOX_W = 760f
    const val VIEWBOX_H = 385f
    private const val STROKE_WIDTH = 6.5f // viewBox units (~2.7dp at the default logo width)

    private const val CX = 480f
    private const val CY = 512f
    private const val TRACK_RIGHT = 612f
    private const val CORE_R = 26f
    private val RINGS = listOf(130f, 104f, 78f, 52f)

    // Draw choreography (ms) — identical to the JS LogoDrawAnimation.
    private const val TRACK_START = 150L
    private const val TRACK_STAGGER = 80L
    private const val TRACK_DUR = 800L
    private const val CORE_START = 250L
    private const val CORE_DUR = 1100L
    private const val RING_START = 1050L
    private const val RING_STAGGER = 140L
    private const val RING_DUR = 480L
    private const val WAVE_START = 1600L
    private const val WAVE_STAGGER = 95L
    private const val WAVE_DUR = 620L

    // Split ("Netflix") choreography — identical to the JS LogoDrawAnimation.
    private const val HOLD_MS = 350L
    private const val SPLIT_MS = 1150L
    private const val SPLIT_STAGGER = 0.03f
    private const val SPLIT_SPAN = 0.6f
    private const val SPLIT_SCALE = 2.6f
    private const val SPLIT_SCALE_PER_LAYER = 0.45f

    private val TRACKS =
        listOf(
            Track(25f) { p -> p.cubicTo(657f, 487f, 620f, 469f, 660f, 469f); p.cubicTo(705f, 469f, 750f, 585f, 790f, 585f); p.lineTo(830f, 585f) },
            Track(40f) { p -> p.cubicTo(657f, 472f, 625.7f, 451.75f, 665.7f, 451.75f); p.cubicTo(710.7f, 451.75f, 758.25f, 592.5f, 798.25f, 592.5f); p.lineTo(840.5f, 592.5f) },
            Track(55f) { p -> p.cubicTo(657f, 457f, 631.4f, 434.5f, 671.4f, 434.5f); p.cubicTo(716.4f, 434.5f, 766.5f, 600f, 806.5f, 600f); p.lineTo(851f, 600f) },
            Track(70f) { p -> p.cubicTo(657f, 442f, 637.1f, 417.25f, 677.1f, 417.25f); p.cubicTo(722.1f, 417.25f, 774.75f, 607.5f, 814.75f, 607.5f); p.lineTo(861.5f, 607.5f) },
            Track(85f) { p -> p.cubicTo(657f, 427f, 642.8f, 400f, 682.8f, 400f); p.cubicTo(727.8f, 400f, 783f, 615f, 823f, 615f); p.lineTo(872f, 615f) },
            Track(100f) { p -> p.cubicTo(657f, 412f, 648.5f, 382.75f, 688.5f, 382.75f); p.cubicTo(733.5f, 382.75f, 791.25f, 622.5f, 831.25f, 622.5f); p.lineTo(882.5f, 622.5f) },
            Track(115f) { p -> p.cubicTo(657f, 397f, 654.2f, 365.5f, 694.2f, 365.5f); p.cubicTo(739.2f, 365.5f, 799.5f, 630f, 839.5f, 630f); p.lineTo(893f, 630f) },
            Track(130f) { p -> p.cubicTo(657f, 382f, 659.9f, 348.25f, 699.9f, 348.25f); p.cubicTo(744.9f, 348.25f, 807.75f, 637.5f, 847.75f, 637.5f); p.lineTo(903.5f, 637.5f) },
        )

    private val DRAW_MS = WAVE_START + WAVE_STAGGER * (TRACKS.size - 1) + WAVE_DUR
    val TOTAL_MS = DRAW_MS + HOLD_MS + SPLIT_MS
  }
}
