import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  RadialGradient,
  Stop,
  Text as SvgText
} from 'react-native-svg';
import { colors } from '../theme/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Configuration
const CONFIG = {
  node: {
    radius: 28,
    spacing: 100,
    colors: {
      archetypal: '#8B5CF6', // Purple
      emotional: colors.error,  // Red
      somatic: colors.success,    // Green
      spiritual: colors.primary,  // Blue
      colors: colors.warning,     // Amber
      beings: '#EC4899',     // Pink
      parts: '#8B5A2B',      // Brown
      unknown: colors.textSecondary     // Gray
    }
  },
  connection: {
    strokeWidth: 2,
    colors: {
      strong: '#059669',
      medium: '#D97706', 
      weak: colors.textLight
    }
  },
  canvas: {
    width: Math.max(screenWidth * 2, 800),
    height: Math.max(screenHeight * 1.8, 600),
    padding: 80
  }
};

function MindMapNative({ 
  entities = [], 
  connections = [], 
  onEntitySelect,
  onConnectionCreate,
  sessionTitle = "Mind Map"
}) {
  const [nodePositions, setNodePositions] = useState({});
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Initialize node positions when entities change
  useEffect(() => {
    if (entities.length > 0) {
      const positions = generateInitialLayout(entities);
      setNodePositions(positions);
    }
  }, [entities]);

  // Auto-scroll to center when positions are set
  useEffect(() => {
    if (Object.keys(nodePositions).length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        const centerX = (CONFIG.canvas.width - screenWidth) / 2;
        const centerY = (CONFIG.canvas.height - screenHeight) / 2;
        
        scrollViewRef.current?.scrollTo({ 
          x: Math.max(0, centerX), 
          y: Math.max(0, centerY),
          animated: true 
        });
      }, 200);
    }
  }, [nodePositions]);

  // Generate smart initial layout
  function generateInitialLayout(entities) {
    const positions = {};
    const centerX = CONFIG.canvas.width / 2;
    const centerY = CONFIG.canvas.height / 2;
    
    if (entities.length === 0) return positions;
    
    if (entities.length === 1) {
      positions[entities[0].id] = { x: centerX, y: centerY };
      return positions;
    }

    if (entities.length <= 4) {
      // Grid layout for small numbers
      const cols = Math.ceil(Math.sqrt(entities.length));
      const spacingX = 120;
      const spacingY = 100;
      
      const startX = centerX - ((cols - 1) * spacingX) / 2;
      const startY = centerY - spacingY / 2;
      
      entities.forEach((entity, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        positions[entity.id] = {
          x: startX + (col * spacingX),
          y: startY + (row * spacingY)
        };
      });
      return positions;
    }

    // Circular layout for larger numbers
    const radius = Math.min(200, (CONFIG.canvas.width - 200) / 3);
    
    entities.forEach((entity, index) => {
      const angle = (index / entities.length) * 2 * Math.PI - Math.PI / 2;
      positions[entity.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });

    return positions;
  }

  // Handle node selection
  function handleNodePress(entity) {
    if (isCreatingConnection) {
      if (selectedNodes.length === 0) {
        setSelectedNodes([entity]);
      } else if (selectedNodes.length === 1 && selectedNodes[0].id !== entity.id) {
        // Create connection between selected nodes
        createConnection(selectedNodes[0], entity);
        setSelectedNodes([]);
        setIsCreatingConnection(false);
      }
    } else {
      onEntitySelect?.(entity);
    }
  }

  // Create connection between two entities
  async function createConnection(entity1, entity2) {
    const showAlert = Platform.OS === 'web' ? 
      (title, message, buttons) => {
        const result = window.confirm(`${title}\n\n${message}`);
        if (result && buttons.find(b => b.text === 'Connect')) {
          buttons.find(b => b.text === 'Connect').onPress();
        }
      } : Alert.alert;

    showAlert(
      "Create Connection",
      `Connect "${entity1.name}" with "${entity2.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Connect", 
          onPress: () => {
            const connection = {
              entity1_id: entity1.id,
              entity2_id: entity2.id,
              connection_type: 'association',
              strength: 0.8,
              description: `User created connection between ${entity1.name} and ${entity2.name}`
            };
            onConnectionCreate?.(connection);
          }
        }
      ]
    );
  }

  // Render entity node
  function renderNode(entity) {
    const position = nodePositions[entity.id];
    if (!position) return null;

    const isSelected = selectedNodes.some(n => n.id === entity.id);
    const color = CONFIG.node.colors[entity.category] || CONFIG.node.colors.unknown;
    const displayName = entity.name.length > 10 ? 
      entity.name.substring(0, 8) + '...' : 
      entity.name;
    
    return (
      <G key={entity.id}>
        {/* Node Shadow */}
        <Circle
          cx={position.x + 3}
          cy={position.y + 3}
          r={CONFIG.node.radius}
          fill="rgba(0,0,0,0.15)"
        />
        
        {/* Selection ring */}
        {isSelected && (
          <Circle
            cx={position.x}
            cy={position.y}
            r={CONFIG.node.radius + 8}
            fill="none"
            stroke="#fff"
            strokeWidth={4}
            opacity={0.8}
          />
        )}
        
        {/* Main Node */}
        <Circle
          cx={position.x}
          cy={position.y}
          r={CONFIG.node.radius}
          fill={`url(#gradient-${entity.category || 'unknown'})`}
          stroke="rgba(255,255,255,0.8)"
          strokeWidth={2}
          onPress={() => handleNodePress(entity)}
        />
        
        {/* Node Label */}
        <SvgText
          x={position.x}
          y={position.y + 4}
          fontSize="13"
          fill="white"
          textAnchor="middle"
          fontWeight="bold"
          onPress={() => handleNodePress(entity)}
        >
          {displayName}
        </SvgText>
        
        {/* Confidence indicator */}
        {entity.confidence && (
          <Circle
            cx={position.x + 22}
            cy={position.y - 22}
            r={5}
            fill={entity.confidence > 0.8 ? colors.success : entity.confidence > 0.5 ? colors.warning : colors.error}
            stroke="white"
            strokeWidth={1}
            opacity={0.9}
          />
        )}
        
        {/* Category indicator */}
        <Circle
          cx={position.x - 22}
          cy={position.y - 22}
          r={4}
          fill={color}
          opacity={0.7}
        />
      </G>
    );
  }

  // Render connection line
  function renderConnection(connection) {
    const entity1 = entities.find(e => e.id === connection.entity1_id);
    const entity2 = entities.find(e => e.id === connection.entity2_id);
    
    if (!entity1 || !entity2) return null;
    
    const pos1 = nodePositions[entity1.id];
    const pos2 = nodePositions[entity2.id];
    
    if (!pos1 || !pos2) return null;

    const strength = connection.strength || 0.5;
    const color = strength > 0.8 ? 
      CONFIG.connection.colors.strong : 
      strength > 0.5 ? 
        CONFIG.connection.colors.medium : 
        CONFIG.connection.colors.weak;

    return (
      <Line
        key={`${connection.entity1_id}-${connection.entity2_id}`}
        x1={pos1.x}
        y1={pos1.y}
        x2={pos2.x}
        y2={pos2.y}
        stroke={color}
        strokeWidth={CONFIG.connection.strokeWidth * Math.max(strength, 0.3)}
        opacity={0.7}
        strokeDasharray={strength < 0.5 ? "5,5" : "0"}
      />
    );
  }

  // Control buttons
  const renderControls = () => (
    <View style={styles.controls}>
      <TouchableOpacity 
        style={[styles.controlButton, isCreatingConnection && styles.activeButton]}
        onPress={() => {
          setIsCreatingConnection(!isCreatingConnection);
          setSelectedNodes([]);
        }}
      >
        <Text style={styles.controlButtonText}>
          {isCreatingConnection ? "Cancel" : "Connect"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.controlButton}
        onPress={() => {
          const newPositions = generateInitialLayout(entities);
          setNodePositions(newPositions);
        }}
      >
        <Text style={styles.controlButtonText}>Re-layout</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.controlButton}
        onPress={() => {
          const centerX = (CONFIG.canvas.width - screenWidth) / 2;
          const centerY = (CONFIG.canvas.height - screenHeight) / 2;
          scrollViewRef.current?.scrollTo({ 
            x: Math.max(0, centerX), 
            y: Math.max(0, centerY),
            animated: true 
          });
        }}
      >
        <Text style={styles.controlButtonText}>Center</Text>
      </TouchableOpacity>
    </View>
  );

  if (entities.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{sessionTitle}</Text>
          <Text style={styles.subtitle}>No entities discovered yet</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Start Your Integration Journey</Text>
          <Text style={styles.emptyStateText}>
            Begin chatting with Claude to discover symbols, emotions, and insights from your experience. 
            They'll appear here as an interactive mind map showing the connections between different elements.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{sessionTitle}</Text>
        <Text style={styles.subtitle}>
          {entities.length} entities • {connections.length} connections
        </Text>
      </View>

      {/* Controls */}
      {renderControls()}

      {/* Mind Map Container */}
      <View style={styles.mapContainer}>
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={{
            width: CONFIG.canvas.width,
            height: CONFIG.canvas.height,
          }}
          style={styles.scrollView}
          showsHorizontalScrollIndicator={true}
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEnabled={true}
          directionalLockEnabled={false}
          minimumZoomScale={0.5}
          maximumZoomScale={2.0}
          bouncesZoom={true}
        >
          <Svg 
            width={CONFIG.canvas.width} 
            height={CONFIG.canvas.height}
            style={styles.svg}
          >
            <Defs>
              {/* Gradient definitions for nodes */}
              {Object.entries(CONFIG.node.colors).map(([category, color]) => (
                <RadialGradient
                  key={category}
                  id={`gradient-${category}`}
                  cx="30%"
                  cy="30%"
                  r="70%"
                >
                  <Stop offset="0%" stopColor="white" stopOpacity="0.3" />
                  <Stop offset="50%" stopColor={color} stopOpacity="0.9" />
                  <Stop offset="100%" stopColor={color} stopOpacity="1" />
                </RadialGradient>
              ))}
            </Defs>
            
            {/* Render all connections first (behind nodes) */}
            {connections.map(renderConnection)}
            
            {/* Render all entity nodes */}
            {entities.map(renderNode)}
          </Svg>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(CONFIG.node.colors).map(([category, color]) => {
            const count = entities.filter(e => e.category === category).length;
            if (count === 0) return null;
            
            return (
              <View key={category} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: color }]} />
                <Text style={styles.legendText}>
                  {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Connection mode instructions */}
      {isCreatingConnection && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>
            {selectedNodes.length === 0 ? 
              "Tap an entity to start connecting" : 
              `Selected: ${selectedNodes[0].name} - tap another entity to connect`
            }
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  controlButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  activeButton: {
    backgroundColor: '#f56565',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  legend: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    maxHeight: 60,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '500',
  },
  instructionBanner: {
    backgroundColor: colors.bubbleParts,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#feb2b2',
  },
  instructionText: {
    textAlign: 'center',
    color: '#c53030',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
});

export default MindMapNative;