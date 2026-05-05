import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import FormattedText from '../components/FormattedText';

const MessageBubble = ({ message, entities = [], nervousSystemState, onEntityPress }) => {
  const isUser = message.role === 'user';

  const getBubbleStyle = () => {
    const baseStyle = {
      marginVertical: 4,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      maxWidth: '85%',
    };

    if (isUser) {
      return {
        ...baseStyle,
        backgroundColor: colors.primary,
        alignSelf: 'flex-end',
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: colors.lightGray,
      };
    }
  };

  const getTextStyle = () => {
    return {
      fontSize: 16,
      lineHeight: 22,
      color: isUser ? colors.textInverse : colors.text,
    };
  };

  const renderEntities = () => {
    if (!entities || entities.length === 0) return null;

    return (
      <View style={styles.entitiesContainer}>
        {entities.map((entity, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.entityChip,
              { backgroundColor: getEntityColor(entity.category) }
            ]}
            onPress={() => onEntityPress && onEntityPress(entity)}
          >
            <Text style={styles.entityText}>{entity.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getEntityColor = (category) => {
    switch (category) {
      case 'archetypal': return colors.bubbleArchetypal;
      case 'emotional': return colors.bubbleEmotional;
      case 'somatic': return colors.bubbleSomatic;
      case 'spiritual': return `${colors.primary}1A`;
      case 'parts': return colors.bubbleParts;
      default: return colors.offWhite;
    }
  };

  return (
    <View style={getBubbleStyle()}>
      <FormattedText style={getTextStyle()}>{message.content}</FormattedText>
      {renderEntities()}

      {/* Show nervous system context if available */}
      {message.nervousSystemContext && (
        <View style={styles.contextIndicator}>
          <Text style={styles.contextText}>
            State: {message.nervousSystemContext.state} ({message.nervousSystemContext.intensity}/10)
          </Text>
        </View>
      )}

      {/* Show if practice is suggested */}
      {message.requiresPractice && (
        <View style={styles.practiceIndicator}>
          <Text style={styles.practiceText}>
            {message.requiresPractice.title || 'Practice available'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = {
  entitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  entityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  entityText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  contextIndicator: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  contextText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  practiceIndicator: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: `${colors.primary}1A`,
    borderRadius: 8,
  },
  practiceText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
};

export default MessageBubble;