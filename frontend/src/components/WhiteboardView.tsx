import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';

interface WhiteboardViewProps {
  whiteboardData: {
    title: string;
    type: 'diagram' | 'equation' | 'graph' | 'steps';
    data: {
      label?: string;
      steps?: string[];
      elements?: Array<{
        shape: 'circle' | 'rect' | 'line';
        x: number;
        y: number;
        label?: string;
      }>;
    };
  };
  onClose: () => void;
}

export default function WhiteboardView({ whiteboardData, onClose }: WhiteboardViewProps) {
  const { title, type } = whiteboardData;
  
  // Robustly handle AI hallucinations where 'data' object is missing
  // or properties are placed directly on the root whiteboard object
  const data = whiteboardData.data || {};
  const safeSteps = data.steps || (whiteboardData as any).steps || [];
  const safeElements = data.elements || (whiteboardData as any).elements || [];
  const safeLabel = data.label || (whiteboardData as any).label || '';

  const renderVisualCanvas = () => {
    switch (type) {
      case 'equation':
        return (
          <ScrollView style={styles.canvasContent}>
            <Text style={styles.canvasDesc}>🧮 Mathematical Breakdown</Text>
            {safeLabel ? <Text style={styles.canvasLabel}>{safeLabel}</Text> : null}
            {safeSteps.map((step: any, idx: number) => (
              <View key={idx} style={styles.equationRow}>
                <View style={styles.equationStepNum}>
                  <Text style={styles.stepNumText}>{idx + 1}</Text>
                </View>
                <Text style={styles.equationText}>{typeof step === 'string' ? step : JSON.stringify(step)}</Text>
              </View>
            ))}
          </ScrollView>
        );

      case 'steps':
        return (
          <ScrollView style={styles.canvasContent}>
            <Text style={styles.canvasDesc}>📋 Conceptual Flowchart</Text>
            {safeLabel ? <Text style={styles.canvasLabel}>{safeLabel}</Text> : null}
            <View style={styles.flowTimeline}>
              {safeSteps.map((step: any, idx: number) => {
                const isLast = idx === safeSteps.length - 1;
                return (
                  <View key={idx} style={styles.timelineNodeContainer}>
                    <View style={styles.timelineRow}>
                      <View style={styles.nodePoint}>
                        <Text style={styles.nodeText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.nodeBubble}>
                        <Text style={styles.nodeBubbleText}>{typeof step === 'string' ? step : JSON.stringify(step)}</Text>
                      </View>
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        );

      case 'graph':
        return (
          <ScrollView contentContainerStyle={[styles.canvasContent, styles.centerCanvas]}>
            <Text style={styles.canvasDesc}>📈 Graphical Plot Mapping</Text>
            {safeLabel ? <Text style={styles.canvasLabel}>{safeLabel}</Text> : null}
            <View style={styles.graphGrid}>
              {/* Y Axis */}
              <View style={styles.yAxis} />
              {/* X Axis */}
              <View style={styles.xAxis} />
              
              {/* Plot lines / Curves representation */}
              <View style={styles.graphPlotCurve} />
              
              {/* Dynamic Coordinate points */}
              {safeElements.map((el: any, idx: number) => (
                <View
                  key={idx}
                  style={[styles.graphDot, { left: el.x || 0, top: el.y || 0 }]}
                >
                  <Text style={styles.graphDotLabel}>{el.label || 'Point'}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        );

      case 'diagram':
      default:
        return (
          <ScrollView contentContainerStyle={[styles.canvasContent, styles.centerCanvas]}>
            <Text style={styles.canvasDesc}>🎨 Vector Schematic Illustration</Text>
            {safeLabel ? <Text style={styles.canvasLabel}>{safeLabel}</Text> : null}
            
            <View style={styles.vectorCanvas}>
              {/* Draw shape layers dynamically - Using Flexbox to auto-arrange instead of absolute coords */}
              {safeElements.map((el: any, idx: number) => {
                if (el.shape === 'circle') {
                  return (
                    <View key={idx} style={styles.vectorCircle}>
                      <Text style={styles.vectorLabel}>{el.label || 'Node'}</Text>
                    </View>
                  );
                } else if (el.shape === 'rect') {
                  return (
                    <View key={idx} style={styles.vectorRect}>
                      <Text style={styles.vectorLabel}>{el.label || 'Block'}</Text>
                    </View>
                  );
                } else {
                  return (
                    <View key={idx} style={styles.vectorLine}>
                      <Text style={styles.vectorLineLabel}>{el.label || 'Connection'}</Text>
                    </View>
                  );
                }
              })}
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EduGuru Whiteboard</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close Whiteboard ✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.whiteboardFrame}>
        <View style={styles.canvasHeader}>
          <Text style={styles.canvasTitle}>{title}</Text>
        </View>
        
        {renderVisualCanvas()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  closeBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  whiteboardFrame: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Premium White Board Canvas style
    borderRadius: 20,
    borderWidth: 8,
    borderColor: '#161B26', // dark wooden bezel
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  canvasHeader: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  canvasTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  canvasContent: {
    flex: 1,
    padding: 20,
  },
  centerCanvas: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasDesc: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  canvasLabel: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  equationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  equationStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  equationText: {
    flex: 1,
    flexWrap: 'wrap',
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  flowTimeline: {
    paddingLeft: 10,
  },
  timelineNodeContainer: {
    marginBottom: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodePoint: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  nodeBubble: {
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 12,
    marginLeft: 14,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nodeBubbleText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: '#10B981',
    marginLeft: 13,
    marginVertical: -2,
    zIndex: 1,
  },
  graphGrid: {
    width: 260,
    height: 260,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    position: 'relative',
  },
  yAxis: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: '#9CA3AF',
    left: '50%',
  },
  xAxis: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: '#9CA3AF',
    top: '50%',
  },
  graphPlotCurve: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderColor: '#EF4444',
    borderWidth: 2,
    borderTopLeftRadius: 80,
    borderBottomRightRadius: 80,
    left: 50,
    top: 50,
  },
  graphDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B5CF6',
    transform: [{ translateX: -5 }, { translateY: -5 }],
  },
  graphDotLabel: {
    position: 'absolute',
    color: '#374151',
    fontSize: 9,
    fontWeight: '700',
    width: 80,
    top: 12,
    left: -20,
    textAlign: 'center',
  },
  vectorCanvas: {
    width: 280,
    minHeight: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  vectorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 2,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  vectorRect: {
    width: 70,
    height: 44,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  vectorLine: {
    height: 2,
    width: 40,
    backgroundColor: '#F59E0B',
    marginHorizontal: 4,
    marginVertical: 10,
  },
  vectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  vectorLineLabel: {
    position: 'absolute',
    top: -16,
    fontSize: 9,
    fontWeight: '700',
    color: '#F59E0B',
    width: 100,
    textAlign: 'center',
  },
});
