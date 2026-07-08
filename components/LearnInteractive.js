import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Layers,
  HelpCircle,
  RotateCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react-native';
import { colors } from '../theme/colors';

/**
 * LearnInteractive — renders an optional `interactive[]` block on an education
 * topic. Each entry is a small, self-contained widget with ephemeral local
 * state (no persistence, no backend). Keep widgets accessible and low-stakes:
 * these are practice aids, not graded assessments.
 *
 * Supported widget shapes:
 *   { type: 'flashcards', title, intro, cards: [{ front, back }] }
 *   { type: 'scenario',  title, intro, prompt,
 *       items: [{ scenario, options: [string], answer: <index>, explanation }] }
 */

// ── Flashcards ──────────────────────────────────────────────────────────────
function Flashcards({ title, intro, cards = [] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return null;
  const card = cards[index];

  const go = (delta) => {
    setFlipped(false);
    setIndex((i) => (i + delta + cards.length) % cards.length);
  };

  return (
    <View style={styles.widget}>
      <View style={styles.widgetTitleRow}>
        <Layers size={18} color={colors.primary} strokeWidth={2} />
        <Text style={styles.widgetTitle}>{title || 'Flashcards'}</Text>
      </View>
      {intro ? <Text style={styles.widgetIntro}>{intro}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => setFlipped((f) => !f)}
      >
        <View style={styles.cardFlipHint}>
          <RotateCw size={13} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.cardFlipHintText}>
            {flipped ? 'Tap to flip back' : 'Tap to reveal'}
          </Text>
        </View>
        <Text style={flipped ? styles.cardBack : styles.cardFront}>
          {flipped ? card.back : card.front}
        </Text>
      </TouchableOpacity>

      <View style={styles.cardNav}>
        <TouchableOpacity style={styles.cardNavBtn} onPress={() => go(-1)}>
          <ChevronLeft size={20} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.cardCount}>
          {index + 1} / {cards.length}
        </Text>
        <TouchableOpacity style={styles.cardNavBtn} onPress={() => go(1)}>
          <ChevronRight size={20} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Scenario quiz (e.g. "name the distortion") ───────────────────────────────
function Scenario({ title, intro, prompt, items = [] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);

  if (items.length === 0) return null;
  const item = items[index];
  const answered = selected !== null;
  const isLast = index === items.length - 1;

  const choose = (i) => {
    if (answered) return;
    setSelected(i);
  };

  const next = () => {
    setSelected(null);
    setIndex((i) => (i + 1) % items.length);
  };

  const restart = () => {
    setSelected(null);
    setIndex(0);
  };

  return (
    <View style={styles.widget}>
      <View style={styles.widgetTitleRow}>
        <HelpCircle size={18} color={colors.primary} strokeWidth={2} />
        <Text style={styles.widgetTitle}>{title || 'Practice'}</Text>
      </View>
      {intro ? <Text style={styles.widgetIntro}>{intro}</Text> : null}

      <Text style={styles.scenarioCount}>
        {index + 1} of {items.length}
      </Text>
      {prompt ? <Text style={styles.scenarioPrompt}>{prompt}</Text> : null}
      <View style={styles.scenarioBubble}>
        <Text style={styles.scenarioText}>{item.scenario}</Text>
      </View>

      {item.options.map((opt, i) => {
        const isCorrect = i === item.answer;
        const isPicked = i === selected;
        let optStyle = styles.option;
        let labelStyle = styles.optionText;
        let icon = null;
        if (answered && isCorrect) {
          optStyle = [styles.option, styles.optionCorrect];
          labelStyle = [styles.optionText, styles.optionTextStrong];
          icon = <Check size={16} color="#166534" strokeWidth={2.5} />;
        } else if (answered && isPicked && !isCorrect) {
          optStyle = [styles.option, styles.optionWrong];
          labelStyle = [styles.optionText, styles.optionTextStrong];
          icon = <X size={16} color="#b91c1c" strokeWidth={2.5} />;
        }
        return (
          <TouchableOpacity
            key={i}
            style={optStyle}
            activeOpacity={answered ? 1 : 0.7}
            onPress={() => choose(i)}
          >
            <Text style={labelStyle}>{opt}</Text>
            {icon}
          </TouchableOpacity>
        );
      })}

      {answered ? (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>{item.explanation}</Text>
          <TouchableOpacity style={styles.nextBtn} onPress={isLast ? restart : next}>
            {isLast ? (
              <RefreshCw size={16} color={colors.primary} strokeWidth={2} />
            ) : null}
            <Text style={styles.nextBtnText}>
              {isLast ? 'Start over' : 'Next scenario'}
            </Text>
            {!isLast ? (
              <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
            ) : null}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default function LearnInteractive({ items = [] }) {
  if (!items || items.length === 0) return null;
  return (
    <View>
      {items.map((widget, i) => {
        if (widget.type === 'flashcards') {
          return <Flashcards key={i} {...widget} />;
        }
        if (widget.type === 'scenario') {
          return <Scenario key={i} {...widget} />;
        }
        return null;
      })}
    </View>
  );
}

const styles = {
  widget: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  widgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  widgetIntro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },

  // Flashcards
  card: {
    minHeight: 140,
    backgroundColor: '#eef2fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d4f0',
    padding: 20,
    justifyContent: 'center',
  },
  cardFlipHint: {
    position: 'absolute',
    top: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardFlipHintText: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardFront: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  cardBack: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  cardNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  cardNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2fb',
  },
  cardCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Scenario
  scenarioCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  scenarioPrompt: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  scenarioBubble: {
    backgroundColor: '#eef2fb',
    borderRadius: 12,
    borderTopLeftRadius: 2,
    padding: 16,
    marginBottom: 16,
  },
  scenarioText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 23,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  optionCorrect: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  optionWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  optionTextStrong: {
    fontWeight: '600',
  },
  feedback: {
    marginTop: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 14,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#eef2fb',
    borderWidth: 1,
    borderColor: '#c7d4f0',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
};
