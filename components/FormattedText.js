import React from 'react';
import { Text } from 'react-native';

/**
 * Renders text with **bold** markdown parsed into actual bold <Text> nodes.
 * Drop-in replacement for <Text>{message.content}</Text>.
 *
 * Usage:
 *   <FormattedText style={styles.messageText}>{message.content}</FormattedText>
 */
const FormattedText = ({ children, style, ...props }) => {
  if (!children || typeof children !== 'string') {
    return <Text style={style} {...props}>{children}</Text>;
  }

  const parts = children.split(/(\*\*[^*]+\*\*)/g);

  if (parts.length === 1) {
    // No bold markers found — render as plain text
    return <Text style={style} {...props}>{children}</Text>;
  }

  return (
    <Text style={style} {...props}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={{ fontWeight: 'bold' }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
};

export default FormattedText;
