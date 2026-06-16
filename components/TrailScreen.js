import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop, Image as SvgImage } from 'react-native-svg';
import { ArrowLeft, X, ChevronRight, Sparkles } from 'lucide-react-native';

import { tracks, TRUNK_TRACK_ID, TRUNK_MARKER_IDS } from '../content/tracks';
import { exercises } from '../content/exercises-comprehensive';
import { educationTopics } from '../content/education';
import { colors } from '../theme/colors';
import {
  loadEngagement,
  isEngaged,
  markEngaged,
  getTrackProgress,
} from '../lib/trailProgress';

const RUBBLE = require('../assets/images/icons/rubble.png');
const BALANCE = require('../assets/images/icons/balance.png');

const TRUNK_TITLE = "Start here";
const TRUNK_SUBTITLE = "The floor. Everything else stands on this.";

const exerciseById = (refId) => {
  for (const cat of Object.values(exercises)) {
    if (!Array.isArray(cat)) continue;
    const found = cat.find(e => e.id === refId);
    if (found) return found;
  }
  return null;
};

const educationById = (refId) => educationTopics.find(t => t.id === refId);

const MarkerImage = ({ engaged, size }) => (
  <Image
    source={engaged ? BALANCE : RUBBLE}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

/**
 * Generate a meandering S-curve path for the trail.
 *
 * The path snakes left-right around a center axis. Each "segment" is one
 * row of vertical space, and the curve alternates which side it swings to.
 *
 * @param {object} opts
 * @param {number} opts.width        - Total width of the path SVG (centerline = width / 2)
 * @param {number} opts.rowHeight    - Vertical space each marker row occupies
 * @param {number} opts.rowCount     - How many marker rows to span
 * @param {number} opts.amplitude    - How far the path swings from center (px)
 * @param {number} [opts.topInset]   - Pixels of straight line above the first wave
 * @param {number} [opts.bottomInset]- Pixels to subtract from the final length
 * @returns {string} SVG path d-attribute
 */
const meanderingPath = ({ width, rowHeight, rowCount, amplitude, topInset = 16, bottomInset = 24 }) => {
  const cx = width / 2;
  const totalH = rowCount * rowHeight - bottomInset;
  let d = `M ${cx} 0 L ${cx} ${topInset}`;
  for (let i = 0; i < rowCount; i++) {
    const yStart = topInset + i * rowHeight;
    const yEnd = Math.min(topInset + (i + 1) * rowHeight, totalH);
    const swingDir = i % 2 === 0 ? -1 : 1;
    const swingX = cx + amplitude * swingDir;
    const c1y = yStart + (yEnd - yStart) * 0.35;
    const c2y = yStart + (yEnd - yStart) * 0.65;
    d += ` C ${swingX} ${c1y}, ${swingX} ${c2y}, ${cx} ${yEnd}`;
  }
  return d;
};

/**
 * Generate a wide, snaking watercolor trail that flows down the center of
 * the canvas. Markers sit BESIDE the path (alternating left/right of
 * center), not on it — the path is one uninterrupted smooth curve.
 *
 * The path swings toward each marker's side as it descends past that
 * marker's y-coordinate, so visually the path "reaches toward" each
 * marker without touching it.
 *
 * Returns:
 *   path:     SVG d-attribute (smooth, never interrupted)
 *   markers:  [{ x, y }] positions for marker ICONS (beside the path)
 *   labelSide:['left'|'right', ...] which side each label sits on
 *
 * @param {object} opts
 * @param {number} opts.width    - Canvas width in px
 * @param {number} opts.count    - Number of markers
 * @param {number} opts.spacing  - Vertical spacing between markers
 * @param {number} [opts.markerOffset] - Distance from path centerline to marker (px)
 * @param {number} [opts.pathAmplitude] - How far path itself swings from center (px)
 */
const snakingTrail = ({ width, count, spacing, markerOffset = 90, pathAmplitude = 46 }) => {
  const cx = width / 2;
  const markers = [];
  const labelSide = [];
  // Markers alternate to the left and right of the path's centerline.
  // The label sits on the SAME side as the marker (reads as a pair).
  for (let i = 0; i < count; i++) {
    const y = 40 + i * spacing;
    const onLeft = i % 2 === 0;
    const x = onLeft ? cx - markerOffset : cx + markerOffset;
    markers.push({ x, y });
    // Label sits on the OPPOSITE side of the path from the marker, so it
    // has room to extend toward the center/other-edge of the canvas
    // instead of getting clipped off the screen.
    labelSide.push(onLeft ? 'right' : 'left');
  }
  if (markers.length === 0) return { path: '', markers, labelSide };

  // Build the path as a smooth sine-wave-like curve down the center.
  // The path passes through "swing points" near (not at) each marker.
  // Vertical-tangent control points on each side give smooth flow — the
  // path never has a cusp or sharp angle.
  const swingPoints = markers.map((m, i) => {
    const onLeft = i % 2 === 0;
    return { x: onLeft ? cx - pathAmplitude : cx + pathAmplitude, y: m.y };
  });

  const vco = spacing * 0.45; // control-point offset above/below each swing point
  const first = swingPoints[0];
  let d = `M ${first.x} ${first.y - 40}`;
  d += ` L ${first.x} ${first.y}`;

  for (let i = 1; i < swingPoints.length; i++) {
    const prev = swingPoints[i - 1];
    const curr = swingPoints[i];
    const c1x = prev.x;
    const c1y = prev.y + vco;
    const c2x = curr.x;
    const c2y = curr.y - vco;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${curr.x} ${curr.y}`;
  }
  const last = swingPoints[swingPoints.length - 1];
  d += ` L ${last.x} ${last.y + 40}`;

  return { path: d, markers, labelSide };
};

/**
 * Directional arrow button — sits at the end of a branch path in the
 * fan-out on the overview. Each arrow points in its own direction (one of
 * 5 angles spread across an arc) and represents one of the 5 tracks.
 * Tapping triggers a directional pan-zoom animation into the track view.
 *
 * Position is set via absolute left/top by the parent; the arrow rotates
 * to its assigned angle. The label + badge sit alongside, oriented
 * upright for legibility.
 *
 * @param {object} props
 * @param {object} props.track       - Track config (name, color)
 * @param {object} props.progress    - { engaged, total }
 * @param {number} props.angle       - Direction the arrow points, in degrees (0 = right, -90 = up, etc.)
 * @param {number} props.size        - Size of the arrow tile (px)
 * @param {function} props.onPress
 */
const BranchArrow = ({ track, progress, angle, size, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.branchArrow,
      {
        width: size,
        height: size,
        backgroundColor: track.color,
        transform: [{ rotate: `${angle}deg` }],
      },
    ]}
  >
    {/* The arrow visual rotates with the tile; the label needs to counter-rotate
        so it always reads upright. */}
    <View
      style={[
        styles.branchArrowInner,
        { transform: [{ rotate: `${-angle}deg` }] },
      ]}
    >
      <Text style={styles.branchArrowName} numberOfLines={1}>{track.name}</Text>
      <Text style={styles.branchArrowBadge}>
        {progress.engaged}/{progress.total}
      </Text>
    </View>
    {/* Arrow-head: small triangle on the leading edge (rotates with tile) */}
    <View style={[styles.branchArrowHead, { borderTopColor: track.color }]} />
  </TouchableOpacity>
);

/**
 * Overview screen — single trunk down the center, then trunk path branches
 * out to 5 square tile-buttons (one per track) below. No concept crossings.
 */
const Overview = ({ engagement, onSelectBranch, onSelectMarker }) => {
  const trunkTrack = tracks.find(t => t.id === TRUNK_TRACK_ID);
  const trunkMarkers = TRUNK_MARKER_IDS.map(id =>
    trunkTrack.markers.find(m => m.id === id)
  );

  // Branches in display order — trunk track's continuation, then the others.
  // Each card shows track name + description + engagement count badge.
  const branchTracks = tracks; // all 5 — Regulating included so users can re-enter it after the trunk

  return (
    <ScrollView contentContainerStyle={styles.overviewScroll} showsVerticalScrollIndicator={false}>

      {/* ── Trunk section ── */}
      <View style={styles.trunkSection}>
        <View style={styles.trunkSectionHeader}>
          <Text style={styles.sectionTitle}>{TRUNK_TITLE}</Text>
          <Text style={styles.sectionSubtitle}>{TRUNK_SUBTITLE}</Text>
        </View>

        {/* Wide snaking trunk path with markers ON the path */}
        {(() => {
          const { width: screenW } = Dimensions.get('window');
          const canvasW = screenW;
          const markerSize = 68;
          const halfMarker = markerSize / 2;
          const spacing = 100;
          const trail = snakingTrail({
            width: canvasW,
            count: trunkMarkers.length,
            spacing,
            margin: 56,
          });
          const canvasH = trunkMarkers.length * spacing + 40;
          return (
            <View style={{ width: canvasW, height: canvasH }}>
              <Svg width={canvasW} height={canvasH} style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="trunkWashOverview" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#d4b88a" stopOpacity="0.4" />
                    <Stop offset="100%" stopColor="#b8966a" stopOpacity="0.28" />
                  </LinearGradient>
                </Defs>
                <Path
                  d={trail.path}
                  stroke="url(#trunkWashOverview)"
                  strokeWidth={38}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Path
                  d={trail.path}
                  stroke="#5b4a3a"
                  strokeWidth={2}
                  strokeDasharray="2 6"
                  fill="none"
                  opacity={0.5}
                />
              </Svg>
              {trunkMarkers.map((marker, i) => {
                const pos = trail.markers[i];
                const labelOnRight = trail.labelSide[i] === 'right';
                const engaged = isEngaged(engagement, TRUNK_TRACK_ID, marker.id);
                return (
                  <React.Fragment key={marker.id}>
                    <TouchableOpacity
                      onPress={() => onSelectMarker(TRUNK_TRACK_ID, marker)}
                      style={{
                        position: 'absolute',
                        left: pos.x - halfMarker,
                        top: pos.y - halfMarker,
                        width: markerSize,
                        height: markerSize,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      activeOpacity={0.7}
                    >
                      <MarkerImage engaged={engaged} size={markerSize} />
                    </TouchableOpacity>
                    <View
                      pointerEvents="none"
                      style={[
                        styles.snakingLabel,
                        labelOnRight
                          ? { left: pos.x + halfMarker + 12, top: pos.y - 18 }
                          : { right: canvasW - (pos.x - halfMarker - 12), top: pos.y - 18, alignItems: 'flex-end' },
                      ]}
                    >
                      <Text style={styles.snakingLabelTitle} numberOfLines={1}>{marker.title}</Text>
                      <Text style={styles.snakingLabelSubtitle} numberOfLines={1}>{marker.subtitle}</Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          );
        })()}
      </View>

      {/* ── Branch fan-out: trunk's bottom radiates into 5 directional arrows ── */}
      {(() => {
        const { width: screenW } = Dimensions.get('window');
        const canvasW = screenW;
        const cx = canvasW / 2;
        const fanH = 380; // tall enough to spread the 5 arrows incl. y-offsets
        const fanStartY = 0;
        // Buttons themselves stay compact so the 5 don't crowd each other,
        // but the arrow-head triangle is large so the directionality still
        // reads as prominent.
        const arrowSize = 84;
        const halfArrow = arrowSize / 2;
        // Each arrow's angle from the "down" direction. -60° = up-and-left,
        // 0° = straight down, +60° = up-and-right. We use angles SPREAD
        // around straight-down so all arrows reach into the visible canvas.
        // Order: angles indexed to branchTracks order
        // [Regulating, Parts, Belief, Somatic, Integration]
        const angleSpec = [-72, -36, 0, 36, 72]; // degrees from straight-down

        // For each track, compute:
        //   - the arrow's center position on the canvas
        //   - the rotation angle (= 90 + angleSpec[i] so 0=right etc.)
        //   - the path d-attribute from (cx, 0) to the arrow center
        // Reserve extra margin for the rotated arrow-head triangle which
        // can extend past the button's bounding box by up to ~18px.
        const radius = Math.min(fanH - arrowSize - 20, canvasW / 2 - arrowSize / 2 - 20);
        // Per-arrow downward y-offset. The 3 inner arrows (Parts/Belief/
        // Somatic) sit at small angles where cos(a) ≈ 1, so without
        // staggering they crowd each other on the same horizontal band.
        // Push them progressively further down so they break out of the
        // arc into a wider vertical spread.
        // Order: [Regulating, Parts, Belief, Somatic, Integration]
        const yOffsetSpec = [0, 48, 86, 48, 0];
        const arrowDescriptors = branchTracks.map((track, i) => {
          const a = angleSpec[i];
          const aRad = (a * Math.PI) / 180;
          // "Down" is (0, +1). Rotate by a degrees clockwise: (sin(a), cos(a)).
          const center = {
            x: cx + Math.sin(aRad) * radius,
            y: fanStartY + Math.cos(aRad) * radius + yOffsetSpec[i],
          };
          // Button's default orientation has the arrow-head triangle on
          // the bottom edge, pointing straight DOWN. In RN, positive
          // rotation is clockwise — and rotating a down-pointing arrow
          // CW by N degrees makes the head swing LEFT (because the
          // bottom-center sweeps in an arc going up-and-left). So to
          // make the head point in the same canvas direction as `a`
          // (which is CW from straight-down: -72 = left, +72 = right),
          // we negate: leftmost arrow (a = -72) needs CSS rotation +72
          // (CW) so its head ends up pointing left.
          const cssRotation = -a;
          // Path: smooth S-curve from origin to arrow center. Control
          // points use vertical tangent at origin and the marker's
          // direction tangent at the arrow.
          const c1x = cx;
          const c1y = fanStartY + radius * 0.4;
          const c2x = center.x - Math.sin(aRad) * (radius * 0.35);
          const c2y = center.y - Math.cos(aRad) * (radius * 0.35);
          const d = `M ${cx} ${fanStartY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${center.x} ${center.y}`;
          return { track, center, cssRotation, d };
        });

        return (
          <View style={styles.branchSection}>
            <View style={styles.branchSectionHeader}>
              <View style={styles.branchSectionLine} />
              <Text style={styles.branchSectionTitle}>Pick a path</Text>
              <View style={styles.branchSectionLine} />
            </View>
            <Text style={styles.branchSectionSubtitle}>
              What's alive right now? Tap an arrow.
            </Text>

            <View style={{ width: canvasW, height: fanH + arrowSize / 2 }}>
              {/* Fan paths */}
              <Svg width={canvasW} height={fanH + arrowSize / 2} style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="fanWash" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#d4b88a" stopOpacity="0.4" />
                    <Stop offset="100%" stopColor="#b8966a" stopOpacity="0.28" />
                  </LinearGradient>
                </Defs>
                {arrowDescriptors.map(({ d }, i) => (
                  <React.Fragment key={`fan-${i}`}>
                    <Path
                      d={d}
                      stroke="url(#fanWash)"
                      strokeWidth={22}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path
                      d={d}
                      stroke="#5b4a3a"
                      strokeWidth={1.5}
                      strokeDasharray="2 5"
                      fill="none"
                      opacity={0.5}
                    />
                  </React.Fragment>
                ))}
              </Svg>

              {/* Arrow buttons positioned at the end of each path */}
              {arrowDescriptors.map(({ track, center, cssRotation }) => {
                const progress = getTrackProgress(engagement, track.id);
                return (
                  <View
                    key={track.id}
                    style={{
                      position: 'absolute',
                      left: center.x - halfArrow,
                      top: center.y - halfArrow,
                    }}
                  >
                    <BranchArrow
                      track={track}
                      progress={progress}
                      angle={cssRotation}
                      size={arrowSize}
                      onPress={() => onSelectBranch(track.id)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        );
      })()}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

/**
 * Track view — wide snaking watercolor trail (v3-mockup style). Markers
 * sit ON the path, alternating left-right across the canvas. Labels float
 * to the side opposite each marker so they have room.
 */
const TrackView = ({ track, engagement, onSelectMarker }) => {
  const markers = track.id === TRUNK_TRACK_ID
    ? track.markers.slice(3)
    : track.markers;

  const { width: screenW } = Dimensions.get('window');
  const canvasW = screenW;
  const markerSize = 72;
  const halfMarker = markerSize / 2;
  const spacing = 108;
  const trail = snakingTrail({
    width: canvasW,
    count: markers.length,
    spacing,
    margin: 56,
  });
  const canvasH = markers.length * spacing + 60;

  return (
    <ScrollView contentContainerStyle={styles.trackScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.trackIntro}>
        <Text style={styles.trackIntroTitle}>{track.description}</Text>
        {track.intro ? (
          <Text style={styles.trackIntroBody}>"{track.intro}"</Text>
        ) : null}
      </View>

      <View style={{ width: canvasW, height: canvasH }}>
        {/* Snaking watercolor path */}
        <Svg
          width={canvasW}
          height={canvasH}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id={`trackWash-${track.id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#d4b88a" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#b8966a" stopOpacity="0.28" />
            </LinearGradient>
          </Defs>
          <Path
            d={trail.path}
            stroke={`url(#trackWash-${track.id})`}
            strokeWidth={38}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d={trail.path}
            stroke="#5b4a3a"
            strokeWidth={2}
            strokeDasharray="2 6"
            fill="none"
            opacity={0.5}
          />
        </Svg>

        {/* Markers + labels positioned over the path */}
        {markers.map((marker, i) => {
          const pos = trail.markers[i];
          const labelOnRight = trail.labelSide[i] === 'right';
          const engaged = isEngaged(engagement, track.id, marker.id);
          return (
            <React.Fragment key={marker.id}>
              <TouchableOpacity
                onPress={() => onSelectMarker(track.id, marker)}
                style={{
                  position: 'absolute',
                  left: pos.x - halfMarker,
                  top: pos.y - halfMarker,
                  width: markerSize,
                  height: markerSize,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                <MarkerImage engaged={engaged} size={markerSize} />
                <View style={[styles.trackDot, { backgroundColor: track.color }]} />
              </TouchableOpacity>
              <View
                pointerEvents="none"
                style={[
                  styles.snakingLabel,
                  labelOnRight
                    ? { left: pos.x + halfMarker + 12, top: pos.y - 18 }
                    : { right: canvasW - (pos.x - halfMarker - 12), top: pos.y - 18, alignItems: 'flex-end' },
                ]}
              >
                <Text style={styles.snakingLabelTitle} numberOfLines={1}>{marker.title}</Text>
                <Text style={styles.snakingLabelSubtitle} numberOfLines={1}>{marker.subtitle}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
};

/**
 * Mandala view — read-only progress visualization. The full lotus drawn at
 * low opacity by default. Markers swap from rubble→balance as engaged.
 * `relatedMarkers` concept arcs fade in progressively: invisible when
 * neither endpoint is engaged, ~30% opacity when one is engaged, full
 * opacity when both are. Petals gain color wash proportional to track
 * engagement.
 */
const MANDALA_VB = { w: 414, h: 706 };
const MANDALA_FORK_Y = 510;
const MANDALA_PETAL_PATHS = {
  regulating: 'M 207 510 Q 150 430 110 340 Q 80 250 70 150 Q 65 70 75 20',
  parts:      'M 207 510 Q 185 430 165 340 Q 150 250 145 150 Q 142 70 148 20',
  integration:'M 207 510 L 207 20',
  belief:     'M 207 510 Q 229 430 249 340 Q 264 250 269 150 Q 272 70 266 20',
  somatic:    'M 207 510 Q 264 430 304 340 Q 334 250 344 150 Q 349 70 339 20',
};
const MANDALA_TRUNK_POSITIONS = [
  { x: 207, y: 685 }, // r1
  { x: 207, y: 605 }, // r2
  { x: 207, y: 525 }, // r3
];
const MANDALA_BRANCH_POSITIONS = {
  regulating: [
    { x: 130, y: 410 }, // r4
    { x: 105, y: 305 }, // r5
    { x:  82, y: 195 }, // r6
    { x:  78, y: 100 }, // r7
    { x:  90, y:  35 }, // r8
  ],
  parts: [
    { x: 180, y: 420 }, // p1
    { x: 167, y: 340 }, // p2
    { x: 158, y: 260 }, // p3
    { x: 152, y: 180 }, // p4
    { x: 148, y: 100 }, // p5
    { x: 150, y:  35 }, // p6
  ],
  integration: [
    { x: 207, y: 460 }, // i1
    { x: 207, y: 380 }, // i2
    { x: 207, y: 300 }, // i3
    { x: 207, y: 220 }, // i4
    { x: 207, y: 140 }, // i5
    { x: 207, y:  60 }, // i6
  ],
  belief: [
    { x: 234, y: 420 }, // b1
    { x: 248, y: 340 }, // b2
    { x: 258, y: 260 }, // b3
    { x: 264, y: 180 }, // b4
    { x: 268, y: 100 }, // b5
    { x: 266, y:  35 }, // b6
  ],
  somatic: [
    { x: 284, y: 410 }, // s1
    { x: 308, y: 305 }, // s2
    { x: 326, y: 195 }, // s3
    { x: 336, y: 100 }, // s4
    { x: 324, y:  35 }, // s5
  ],
};

const findMarkerCoord = (trackId, markerId) => {
  if (trackId === TRUNK_TRACK_ID && TRUNK_MARKER_IDS.includes(markerId)) {
    const idx = TRUNK_MARKER_IDS.indexOf(markerId);
    return MANDALA_TRUNK_POSITIONS[idx];
  }
  const track = tracks.find(t => t.id === trackId);
  if (!track) return null;
  // For trunk track, branch markers are the ones AFTER the first 3.
  const branchMarkers = trackId === TRUNK_TRACK_ID
    ? track.markers.slice(3)
    : track.markers;
  const markerIdx = branchMarkers.findIndex(m => m.id === markerId);
  if (markerIdx === -1) return null;
  const positions = MANDALA_BRANCH_POSITIONS[trackId];
  return positions?.[markerIdx] ?? null;
};

/**
 * Build a fake engagement object that marks the first N% of each track's
 * markers as engaged. Dev-only — used to preview how the mandala looks
 * at various completion levels without actually engaging content.
 */
const simulateEngagement = (pct) => {
  if (pct <= 0) return {};
  const fake = {};
  tracks.forEach(track => {
    const cutoff = Math.ceil(track.markers.length * pct);
    fake[track.id] = {};
    track.markers.slice(0, cutoff).forEach(m => {
      fake[track.id][m.id] = { engagedAt: new Date().toISOString() };
    });
  });
  return fake;
};

const MandalaView = ({ engagement }) => {
  const [simPct, setSimPct] = useState(null); // null = real engagement; 0..1 = simulated
  const activeEngagement = simPct === null ? engagement : simulateEngagement(simPct);

  const { width: screenW } = Dimensions.get('window');
  const canvasW = screenW - 24;
  // Maintain viewBox aspect ratio so the mandala doesn't squish
  const canvasH = canvasW * (MANDALA_VB.h / MANDALA_VB.w);

  // Compute per-track engagement % for petal coloring
  const trackPercents = {};
  tracks.forEach(t => {
    const p = getTrackProgress(activeEngagement, t.id);
    trackPercents[t.id] = p.total > 0 ? p.engaged / p.total : 0;
  });

  // Build the arc list from relatedMarkers in tracks.js
  const arcs = [];
  tracks.forEach(track => {
    track.markers.forEach(marker => {
      if (!marker.relatedMarkers) return;
      marker.relatedMarkers.forEach(ref => {
        const [otherTrackId, otherMarkerId] = ref.split('.');
        // De-dupe: only add when this side comes first alphabetically
        const a = `${track.id}.${marker.id}`;
        const b = ref;
        if (a < b) {
          arcs.push({
            from: { trackId: track.id, markerId: marker.id },
            to: { trackId: otherTrackId, markerId: otherMarkerId },
          });
        }
      });
    });
  });

  return (
    <ScrollView
      contentContainerStyle={styles.mandalaScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mandalaIntro}>
        <Text style={styles.mandalaIntroTitle}>Your mandala</Text>
        <Text style={styles.mandalaIntroBody}>
          A picture of what you've touched. Connections appear as you walk the paths.
        </Text>
      </View>

      <View style={[styles.mandalaCanvas, { width: canvasW, height: canvasH }]}>
        <Svg
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${MANDALA_VB.w} ${MANDALA_VB.h}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Trunk — always rendered at base opacity, gets fuller as trunk markers are engaged */}
          {(() => {
            const trunkEngaged = TRUNK_MARKER_IDS.filter(id =>
              isEngaged(activeEngagement, TRUNK_TRACK_ID, id)
            ).length;
            const trunkPct = trunkEngaged / TRUNK_MARKER_IDS.length;
            return (
              <>
                <Path
                  d="M 207 700 L 207 510"
                  stroke="#b8966a"
                  strokeWidth={26}
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.18 + 0.42 * trunkPct}
                />
                <Path
                  d="M 207 700 L 207 510"
                  stroke="#5b4a3a"
                  strokeWidth={1.5}
                  strokeDasharray="2 5"
                  fill="none"
                  opacity={0.35}
                />
              </>
            );
          })()}

          {/* Petals — opacity gated by track engagement % */}
          {Object.entries(MANDALA_PETAL_PATHS).map(([trackId, d]) => {
            const pct = trackPercents[trackId] || 0;
            return (
              <React.Fragment key={trackId}>
                {/* watercolor wash, fades in with engagement */}
                <Path
                  d={d}
                  stroke="#d4b88a"
                  strokeWidth={20}
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.1 + 0.5 * pct}
                />
                {/* ink linework, always faintly visible */}
                <Path
                  d={d}
                  stroke="#5b4a3a"
                  strokeWidth={1.2}
                  strokeDasharray="2 4"
                  fill="none"
                  opacity={0.3 + 0.3 * pct}
                />
              </React.Fragment>
            );
          })}

          {/* Concept arcs — progressive fade based on endpoint engagement */}
          {arcs.map((arc, i) => {
            const fromCoord = findMarkerCoord(arc.from.trackId, arc.from.markerId);
            const toCoord = findMarkerCoord(arc.to.trackId, arc.to.markerId);
            if (!fromCoord || !toCoord) return null;
            const fromEng = isEngaged(activeEngagement, arc.from.trackId, arc.from.markerId);
            const toEng = isEngaged(activeEngagement, arc.to.trackId, arc.to.markerId);
            let arcOpacity = 0;
            if (fromEng && toEng) arcOpacity = 0.7;
            else if (fromEng || toEng) arcOpacity = 0.25;
            else return null;
            const mx = (fromCoord.x + toCoord.x) / 2;
            const my = (fromCoord.y + toCoord.y) / 2 - 10;
            return (
              <Path
                key={`arc-${i}`}
                d={`M ${fromCoord.x} ${fromCoord.y} Q ${mx} ${my} ${toCoord.x} ${toCoord.y}`}
                stroke="#8b6f47"
                strokeWidth={1.4}
                strokeDasharray="2.5 3.5"
                fill="none"
                opacity={arcOpacity}
              />
            );
          })}

          {/* Trunk markers */}
          {TRUNK_MARKER_IDS.map((mid, i) => {
            const pos = MANDALA_TRUNK_POSITIONS[i];
            const engaged = isEngaged(activeEngagement, TRUNK_TRACK_ID, mid);
            return (
              <SvgImage
                key={mid}
                x={pos.x - 22}
                y={pos.y - 22}
                width={44}
                height={44}
                href={engaged ? BALANCE : RUBBLE}
                opacity={engaged ? 1 : 0.55}
              />
            );
          })}

          {/* Branch markers */}
          {tracks.map(track => {
            const positions = MANDALA_BRANCH_POSITIONS[track.id];
            if (!positions) return null;
            const branchMarkers = track.id === TRUNK_TRACK_ID
              ? track.markers.slice(3)
              : track.markers;
            return branchMarkers.slice(0, positions.length).map((marker, idx) => {
              const pos = positions[idx];
              const engaged = isEngaged(activeEngagement, track.id, marker.id);
              return (
                <SvgImage
                  key={`${track.id}-${marker.id}`}
                  x={pos.x - 19}
                  y={pos.y - 19}
                  width={38}
                  height={38}
                  href={engaged ? BALANCE : RUBBLE}
                  opacity={engaged ? 1 : 0.45}
                />
              );
            });
          })}
        </Svg>
      </View>

      {/* Legend / explainer */}
      <View style={styles.mandalaLegend}>
        <View style={styles.mandalaLegendRow}>
          <View style={[styles.mandalaLegendArc, { opacity: 0.7 }]} />
          <Text style={styles.mandalaLegendText}>Both stones stacked — a connection formed</Text>
        </View>
        <View style={styles.mandalaLegendRow}>
          <View style={[styles.mandalaLegendArc, { opacity: 0.25 }]} />
          <Text style={styles.mandalaLegendText}>One side stacked — waiting</Text>
        </View>
      </View>

      {/* Dev-only simulator — preview the mandala at completion levels
          without actually engaging content. Stripped from production. */}
      {__DEV__ && (
        <View style={styles.devSim}>
          <Text style={styles.devSimLabel}>DEV · simulate completion</Text>
          <View style={styles.devSimRow}>
            {[
              { label: 'Real', value: null },
              { label: '25%', value: 0.25 },
              { label: '50%', value: 0.5 },
              { label: '75%', value: 0.75 },
              { label: '100%', value: 1.0 },
            ].map(opt => {
              const active = simPct === opt.value;
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => setSimPct(opt.value)}
                  style={[styles.devSimBtn, active && styles.devSimBtnActive]}
                >
                  <Text style={[styles.devSimBtnText, active && styles.devSimBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

/**
 * Marker detail bottom sheet.
 */
const MarkerDetail = ({ visible, trackId, marker, engagement, onClose, onOpen }) => {
  const insets = useSafeAreaInsets();
  if (!marker) return null;
  const track = tracks.find(t => t.id === trackId);
  const engaged = isEngaged(engagement, trackId, marker.id);

  let bodyText = '';
  let actionLabel = 'Open';
  if (marker.payload.type === 'exercise') {
    const ex = exerciseById(marker.payload.refId);
    bodyText = ex?.instructions || 'A guided practice.';
    actionLabel = engaged ? 'Practice again' : 'Begin';
  } else if (marker.payload.type === 'education') {
    const topic = educationById(marker.payload.refId);
    bodyText = topic?.description || 'A short reading.';
    actionLabel = engaged ? 'Read again' : 'Read';
  } else if (marker.payload.type === 'conversational') {
    bodyText = 'A guided conversational session.';
    actionLabel = engaged ? 'Return' : 'Start';
  } else if (marker.payload.type === 'tool') {
    bodyText = 'A built-in tool.';
    actionLabel = 'Open';
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 12, 28) }]}
          onPress={() => {}}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetDot, { backgroundColor: track?.color }]} />
            <Text style={styles.sheetTrackName}>{track?.name}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetTitle}>{marker.title}</Text>
          <Text style={styles.sheetSubtitle}>{marker.subtitle}</Text>
          <Text style={styles.sheetBody}>{bodyText}</Text>

          {engaged && (
            <View style={styles.engagedBadgeRow}>
              <Image source={BALANCE} style={styles.engagedBadgeIcon} />
              <Text style={styles.engagedBadgeText}>You've been here.</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.sheetButton, { backgroundColor: track?.color || colors.primary }]}
            onPress={() => onOpen(trackId, marker)}
          >
            <Text style={styles.sheetButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const TrailScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [engagement, setEngagement] = useState({});
  const [activeBranch, setActiveBranch] = useState(null);
  const [showMandala, setShowMandala] = useState(false);
  const [detailMarker, setDetailMarker] = useState(null);
  const [detailTrackId, setDetailTrackId] = useState(null);

  // Slide animation: 0 = overview visible, 1 = track view visible. The
  // direction of motion is set by `slideDirection` at the moment a branch
  // is tapped — -1 means the track enters from the LEFT (user tapped a
  // left-pointing arrow), +1 from the right. The overview always exits
  // opposite the incoming track.
  const slide = useRef(new Animated.Value(0)).current;
  const slideDirection = useRef(1); // updated by handleSelectBranch

  useEffect(() => {
    loadEngagement().then(setEngagement);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadEngagement().then(setEngagement);
    });
    return unsub;
  }, [navigation]);

  // Angle (in degrees, 0=down, negative=left) of each track's overview arrow.
  // The track view slides in from the direction the arrow points: tapping
  // the left-most (Regulating) arrow makes that trail come in from the left,
  // tapping the right-most (Integration) makes it come in from the right.
  const TRACK_ANGLES = {
    regulating: -72,
    parts: -36,
    belief: 0,
    somatic: 36,
    integration: 72,
  };

  const handleSelectBranch = (trackId) => {
    setActiveBranch(trackId);
    // Direction the new view enters from. -1 = enters from left, +1 = right.
    // Angle 0 (Belief) still gets a slight rightward bias so the motion reads.
    const angle = TRACK_ANGLES[trackId] ?? 0;
    const dirSign = angle === 0 ? 0.6 : Math.sign(angle);
    slideDirection.current = dirSign;
    Animated.timing(slide, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleBackToOverview = () => {
    Animated.timing(slide, {
      toValue: 0,
      duration: 280,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setActiveBranch(null));
  };

  const handleSelectMarker = (trackId, marker) => {
    setDetailTrackId(trackId);
    setDetailMarker(marker);
  };

  const handleOpenPayload = async (trackId, marker) => {
    const updated = await markEngaged(trackId, marker.id);
    setEngagement({ ...updated });
    setDetailMarker(null);

    const { type, refId } = marker.payload;
    if (type === 'exercise') {
      const ex = exerciseById(refId);
      if (ex) {
        const track = tracks.find(t => t.id === trackId);
        navigation.navigate('GuidedExercise', {
          exercise: ex,
          categoryColor: track?.color,
          returnTo: 'CurriculumTracker',
        });
      }
    } else if (type === 'education') {
      navigation.navigate('Learn', {
        selectedTopicId: refId,
        returnTo: 'CurriculumTracker',
      });
    } else if (type === 'conversational' || type === 'tool') {
      navigation.navigate(refId);
    }
  };

  const branchTrack = activeBranch ? tracks.find(t => t.id === activeBranch) : null;

  // Directional slide: track enters from the side of the screen its arrow
  // pointed to. Overview exits the opposite side.
  const dir = slideDirection.current;
  const overviewTranslate = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -dir * SCREEN_WIDTH * 0.25],
  });
  const overviewOpacity = slide.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 0.3, 0],
  });
  const trackTranslate = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [dir * SCREEN_WIDTH, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {showMandala ? (
          <TouchableOpacity onPress={() => setShowMandala(false)} style={styles.headerBtn} hitSlop={10}>
            <ArrowLeft size={20} color={colors.text} />
            <Text style={styles.headerBtnText}>Trails</Text>
          </TouchableOpacity>
        ) : activeBranch ? (
          <TouchableOpacity onPress={handleBackToOverview} style={styles.headerBtn} hitSlop={10}>
            <ArrowLeft size={20} color={colors.text} />
            <Text style={styles.headerBtnText}>Trails</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={10}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {showMandala ? 'Your mandala' : (branchTrack ? branchTrack.name : 'Your trails')}
        </Text>
        {!showMandala && !activeBranch ? (
          <TouchableOpacity
            onPress={() => setShowMandala(true)}
            style={styles.mandalaBtn}
            hitSlop={10}
          >
            <Sparkles size={16} color={colors.text} />
            <Text style={styles.mandalaBtnText}>Mandala</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <View style={styles.body}>
        {showMandala ? (
          <MandalaView engagement={engagement} />
        ) : (
          <>
            <Animated.View
              pointerEvents={activeBranch ? 'none' : 'auto'}
              style={[
                StyleSheet.absoluteFill,
                {
                  opacity: overviewOpacity,
                  transform: [{ translateX: overviewTranslate }],
                },
              ]}
            >
              <Overview
                engagement={engagement}
                onSelectBranch={handleSelectBranch}
                onSelectMarker={handleSelectMarker}
              />
            </Animated.View>

            {activeBranch && (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { transform: [{ translateX: trackTranslate }] },
                ]}
              >
                <TrackView
                  track={branchTrack}
                  engagement={engagement}
                  onSelectMarker={handleSelectMarker}
                />
              </Animated.View>
            )}
          </>
        )}
      </View>

      <MarkerDetail
        visible={!!detailMarker}
        trackId={detailTrackId}
        marker={detailMarker}
        engagement={engagement}
        onClose={() => setDetailMarker(null)}
        onOpen={handleOpenPayload}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0e6d0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 40,
  },
  headerBtnText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5b4a3a',
  },
  body: {
    flex: 1,
  },

  // ─── Overview ───
  overviewScroll: {
    paddingTop: 6,
    paddingBottom: 24,
  },
  trunkSection: {
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  trunkSectionHeader: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5b4a3a',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8a7560',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  trunkRow: {
    flexDirection: 'row',
    paddingLeft: 8,
  },
  trunkLineCol: {
    width: 56,
    alignItems: 'center',
  },
  trunkMarkerCol: {
    flex: 1,
    marginLeft: 6,
  },
  trunkMarkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 8,
    gap: 14,
  },
  trunkMarkerText: {
    flex: 1,
  },
  trunkMarkerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5b4a3a',
  },
  trunkMarkerSubtitle: {
    fontSize: 12,
    color: '#8a7560',
    marginTop: 2,
  },

  // ─── Branch section ───
  branchSection: {
    paddingHorizontal: 0,
    paddingTop: 20,
  },
  branchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  branchSectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(91, 74, 58, 0.18)',
  },
  branchSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5b4a3a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  branchSectionSubtitle: {
    fontSize: 12,
    color: '#8a7560',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  // Branch directional arrow — sits at the end of a fan-path. The tile
  // itself rotates to point in its trail's direction; the inner label
  // counter-rotates so the text stays upright.
  branchArrow: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  branchArrowInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  branchArrowName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  branchArrowBadge: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.95,
  },
  // Arrow-head triangle — large, prominent, leading edge of the rotated tile.
  // borderTopColor is set inline per-tile to match the track color.
  branchArrowHead: {
    position: 'absolute',
    bottom: -14,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#5b4a3a',
  },
  // (legacy — kept for any straggler refs)
  branchGrid: {
    gap: 12,
  },
  branchCard: {
    backgroundColor: 'rgba(255,251,240,0.85)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  branchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchCardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  branchCardName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  branchCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  branchCardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  branchCardDesc: {
    fontSize: 12.5,
    color: '#5b4a3a',
    marginTop: 6,
    lineHeight: 17,
  },
  branchCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 2,
  },
  branchCardOpen: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ─── Track view ───
  trackScroll: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  trackIntro: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  trackIntroTitle: {
    fontSize: 14,
    color: '#5b4a3a',
    textAlign: 'center',
    lineHeight: 19,
  },
  trackIntroBody: {
    fontSize: 13,
    color: '#8a7560',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  // snaking-trail label — sits on the OPPOSITE side of the path from
  // the marker, so it has room to extend toward center/edge without
  // getting clipped.
  snakingLabel: {
    position: 'absolute',
    maxWidth: 200,
  },
  snakingLabelTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5b4a3a',
    backgroundColor: 'rgba(255,251,240,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  snakingLabelSubtitle: {
    fontSize: 10.5,
    color: '#8a7560',
    backgroundColor: 'rgba(255,251,240,0.78)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    overflow: 'hidden',
  },
  trackDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  trackMarkerText: {
    flex: 1,
  },
  trackMarkerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5b4a3a',
  },
  trackMarkerSubtitle: {
    fontSize: 12,
    color: '#8a7560',
    marginTop: 2,
  },

  // ─── Bottom sheet ───
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lightGray,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sheetDot: { width: 10, height: 10, borderRadius: 5 },
  sheetTrackName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.06 * 12,
    color: colors.textSecondary,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  sheetBody: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
    marginBottom: 16,
  },
  engagedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f0e2',
    borderRadius: 10,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  engagedBadgeIcon: { width: 24, height: 24, resizeMode: 'contain' },
  engagedBadgeText: { fontSize: 12, color: '#8a7560', fontWeight: '500' },
  sheetButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  // ─── Mandala ───
  mandalaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  mandalaBtnText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  mandalaScroll: {
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 24,
    alignItems: 'center',
  },
  mandalaIntro: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  mandalaIntroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5b4a3a',
  },
  mandalaIntroBody: {
    fontSize: 13,
    color: '#8a7560',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 320,
  },
  mandalaCanvas: {
    alignSelf: 'center',
  },
  mandalaLegend: {
    marginTop: 16,
    gap: 6,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
  },
  mandalaLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mandalaLegendArc: {
    width: 28,
    height: 0,
    borderTopWidth: 1.4,
    borderTopColor: '#8b6f47',
    borderStyle: 'dashed',
  },
  mandalaLegendText: {
    fontSize: 12,
    color: '#8a7560',
  },
  devSim: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'dashed',
  },
  devSimLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  devSimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  devSimBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  devSimBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  devSimBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5b4a3a',
  },
  devSimBtnTextActive: {
    color: '#fff',
  },
});

export default TrailScreen;
