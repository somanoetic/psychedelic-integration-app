import React from 'react';
import { Text } from 'react-native';

/**
 * Renders lightweight inline markdown into styled <Text> nodes:
 *   **bold**   -> bold
 *   *italic*   -> italic   (also supports _italic_)
 * Drop-in replacement for <Text>{message.content}</Text>.
 *
 * Bold is matched before italic so that **text** is never mistaken for
 * an italic run. Unmatched asterisks are left as literal characters.
 *
 * Usage:
 *   <FormattedText style={styles.messageText}>{message.content}</FormattedText>
 */

// Order matters: bold (**...**) must come before italic (*...* / _..._)
// so the italic pattern never grabs the inner text of a bold run.
const TOKEN_RE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|_[^_\n]+_)/g;

const FormattedText = ({ children, style, ...props }) => {
  if (!children || typeof children !== 'string') {
    return <Text style={style} {...props}>{children}</Text>;
  }

  const parts = children.split(TOKEN_RE);

  if (parts.length === 1) {
    // No markdown markers found — render as plain text
    return <Text style={style} {...props}>{children}</Text>;
  }

  return (
    <Text style={style} {...props}>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.length >= 4 && part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={{ fontWeight: 'bold' }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (
          part.length >= 3 &&
          ((part.startsWith('*') && part.endsWith('*')) ||
            (part.startsWith('_') && part.endsWith('_')))
        ) {
          return (
            <Text key={i} style={{ fontStyle: 'italic' }}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
};

export default FormattedText;
