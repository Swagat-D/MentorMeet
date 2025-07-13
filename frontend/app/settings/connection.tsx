// frontend/app/settings/connection.tsx - Connection Settings Screen
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from '@expo/vector-icons';
import ApiService, { testConnection, getCurrentServerIP } from "@/services/api";
import NetworkDiscoveryService from "@/services/networkDiscovery";

interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'testing' | 'discovering';
  message: string;
  details?: any;
  lastChecked?: string;
}

export default function ConnectionSettingsScreen() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'testing',
    message: 'Checking connection...',
  });
  
  const [currentBackend, setCurrentBackend] = useState<string>('');
  const [manualIP, setManualIP] = useState<string>('');
  const [manualPort, setManualPort] = useState<string>('5000');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showManualSetup, setShowManualSetup] = useState(false);

  useEffect(() => {
    checkConnection();
    loadCurrentBackend();
  }, []);

  const loadCurrentBackend = async () => {
    try {
      const backend = await ApiService.getCurrentBackendInfo();
      setCurrentBackend(backend);
      
      // Extract IP for manual input
      const match = backend.match(/http:\/\/([\d.]+):/);
      if (match) {
        setManualIP(match[1]);
      }
    } catch (error) {
      console.error('Error loading current backend:', error);
    }
  };

  const checkConnection = async () => {
    setConnectionStatus({
      status: 'testing',
      message: 'Testing connection...',
    });

    try {
      const result = await testConnection();
      
      setConnectionStatus({
        status: result.success ? 'connected' : 'disconnected',
        message: result.message,
        details: result.details,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } catch (error: any) {
      setConnectionStatus({
        status: 'disconnected',
        message: `Connection failed: ${error.message}`,
        lastChecked: new Date().toLocaleTimeString(),
      });
    }
  };

  const discoverBackend = async () => {
    setIsLoading(true);
    setConnectionStatus({
      status: 'discovering',
      message: 'Scanning network for backend servers...',
    });

    try {
      const success = await ApiService.discoverBackend(true);
      
      if (success) {
        await loadCurrentBackend();
        await checkConnection();
        Alert.alert(
          "✅ Discovery Successful",
          "Backend server found and connected successfully!"
        );
      } else {
        Alert.alert(
          "❌ Discovery Failed",
          "No backend servers found on the network. Try manual setup."
        );
        setConnectionStatus({
          status: 'disconnected',
          message: 'No backend servers found on the network',
          lastChecked: new Date().toLocaleTimeString(),
        });
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        `Discovery failed: ${error.message}`
      );
      setConnectionStatus({
        status: 'disconnected',
        message: `Discovery failed: ${error.message}`,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupManualBackend = async () => {
    if (!manualIP.trim()) {
      Alert.alert("Error", "Please enter a valid IP address");
      return;
    }

    const port = parseInt(manualPort) || 5000;
    setIsLoading(true);
    setConnectionStatus({
      status: 'testing',
      message: `Testing connection to ${manualIP}:${port}...`,
    });

    try {
      const success = await ApiService.setManualBackend(manualIP, port);
      
      if (success) {
        await loadCurrentBackend();
        await checkConnection();
        setShowManualSetup(false);
        Alert.alert(
          "✅ Manual Setup Successful",
          `Connected to backend at ${manualIP}:${port}`
        );
      } else {
        Alert.alert(
          "❌ Connection Failed",
          `Could not connect to ${manualIP}:${port}. Please check the IP address and make sure the backend server is running.`
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        `Manual setup failed: ${error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will clear the cached backend information and force a new discovery on the next connection attempt.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await ApiService.clearBackendCache();
            setCurrentBackend('');
            setConnectionStatus({
              status: 'disconnected',
              message: 'Cache cleared. Please discover or manually configure backend.',
            });
            Alert.alert("Cache Cleared", "Backend cache has been cleared successfully.");
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkConnection();
    await loadCurrentBackend();
    setRefreshing(false);
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#ef4444';
      case 'testing':
      case 'discovering': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'connected': return 'check-circle';
      case 'disconnected': return 'error';
      case 'testing':
      case 'discovering': return 'refresh';
      default: return 'help';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0', '#f1f0ec']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connection Settings</Text>
        <TouchableOpacity style={styles.headerButton} onPress={checkConnection}>
          <MaterialIcons name="refresh" size={24} color="#8b5a3c" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Connection Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 246, 240, 0.9)']}
            style={styles.statusGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statusHeader}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
                {connectionStatus.status === 'testing' || connectionStatus.status === 'discovering' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name={getStatusIcon()} size={24} color="#fff" />
                )}
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {connectionStatus.status === 'connected' && 'Connected'}
                  {connectionStatus.status === 'disconnected' && 'Disconnected'}
                  {connectionStatus.status === 'testing' && 'Testing...'}
                  {connectionStatus.status === 'discovering' && 'Discovering...'}
                </Text>
                <Text style={styles.statusMessage}>{connectionStatus.message}</Text>
                {connectionStatus.lastChecked && (
                  <Text style={styles.statusTime}>
                    Last checked: {connectionStatus.lastChecked}
                  </Text>
                )}
              </View>
            </View>

            {connectionStatus.details && (
              <View style={styles.statusDetails}>
                <Text style={styles.detailsTitle}>Connection Details:</Text>
                {connectionStatus.details.responseTime && (
                  <Text style={styles.detailsText}>
                    Response Time: {connectionStatus.details.responseTime}ms
                  </Text>
                )}
                {connectionStatus.details.url && (
                  <Text style={styles.detailsText}>
                    URL: {connectionStatus.details.url}
                  </Text>
                )}
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Current Backend Card */}
        <View style={styles.backendCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 246, 240, 0.9)']}
            style={styles.backendGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.backendHeader}>
              <MaterialIcons name="dns" size={24} color="#8b5a3c" />
              <Text style={styles.backendTitle}>Current Backend</Text>
            </View>
            
            <View style={styles.backendInfo}>
              <Text style={styles.backendUrl}>{currentBackend || 'Not configured'}</Text>
              {currentBackend && (
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    // You could implement clipboard functionality here
                    Alert.alert("Backend URL", currentBackend);
                  }}
                >
                  <MaterialIcons name="content-copy" size={16} color="#8b5a3c" />
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Auto Discover Button */}
          <TouchableOpacity
            style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
            onPress={discoverBackend}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#a0916d', '#a0916d'] : ['#8b5a3c', '#d97706']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading && connectionStatus.status === 'discovering' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="search" size={20} color="#fff" />
              )}
              <Text style={styles.actionButtonText}>
                {isLoading && connectionStatus.status === 'discovering' ? 'Discovering...' : 'Auto Discover Backend'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Manual Setup Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowManualSetup(!showManualSetup)}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="settings" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Manual Setup</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Test Connection Button */}
          <TouchableOpacity
            style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
            onPress={checkConnection}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#a0916d', '#a0916d'] : ['#059669', '#10b981']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading && connectionStatus.status === 'testing' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="wifi" size={20} color="#fff" />
              )}
              <Text style={styles.actionButtonText}>
                {isLoading && connectionStatus.status === 'testing' ? 'Testing...' : 'Test Connection'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Clear Cache Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={clearCache}
          >
            <LinearGradient
              colors={['#dc2626', '#ef4444']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="clear" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Clear Cache</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Manual Setup Panel */}
        {showManualSetup && (
          <View style={styles.manualSetupCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 246, 240, 0.9)']}
              style={styles.manualSetupGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.manualSetupHeader}>
                <MaterialIcons name="settings-ethernet" size={24} color="#8b5a3c" />
                <Text style={styles.manualSetupTitle}>Manual Backend Setup</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Backend IP Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={manualIP}
                  onChangeText={setManualIP}
                  placeholder="192.168.1.100"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Port</Text>
                <TextInput
                  style={styles.textInput}
                  value={manualPort}
                  onChangeText={setManualPort}
                  placeholder="5000"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.manualSetupButton, isLoading && styles.actionButtonDisabled]}
                onPress={setupManualBackend}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#a0916d', '#a0916d'] : ['#6366f1', '#8b5cf6']}
                  style={styles.manualSetupButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="save" size={20} color="#fff" />
                  )}
                  <Text style={styles.manualSetupButtonText}>
                    {isLoading ? 'Connecting...' : 'Connect to Backend'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>💡 How to find your backend IP:</Text>
                <Text style={styles.helpText}>
                  1. Look at your backend terminal output{'\n'}
                  2. Find the "Network:" URL (e.g., http://192.168.1.100:5000){'\n'}
                  3. Use the IP address from that URL{'\n'}
                  4. Make sure both devices are on the same WiFi network
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 246, 240, 0.9)']}
            style={styles.helpGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.helpHeader}>
              <MaterialIcons name="help-outline" size={24} color="#8b5a3c" />
              <Text style={styles.helpCardTitle}>Troubleshooting</Text>
            </View>

            <View style={styles.troubleshootingList}>
              <View style={styles.troubleshootingItem}>
                <MaterialIcons name="wifi" size={16} color="#8b5a3c" />
                <Text style={styles.troubleshootingText}>
                  Ensure both devices are on the same WiFi network
                </Text>
              </View>
              
              <View style={styles.troubleshootingItem}>
                <MaterialIcons name="security" size={16} color="#8b5a3c" />
                <Text style={styles.troubleshootingText}>
                  Check firewall settings on your computer
                </Text>
              </View>
              
              <View style={styles.troubleshootingItem}>
                <MaterialIcons name="play-arrow" size={16} color="#8b5a3c" />
                <Text style={styles.troubleshootingText}>
                  Make sure the backend server is running
                </Text>
              </View>
              
              <View style={styles.troubleshootingItem}>
                <MaterialIcons name="refresh" size={16} color="#8b5a3c" />
                <Text style={styles.troubleshootingText}>
                  Try restarting both the app and backend server
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.1)",
  },
  headerButton: {
    width: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Status Card
  statusCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusGradient: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: "#8b7355",
    marginBottom: 2,
  },
  statusTime: {
    fontSize: 12,
    color: "#a0916d",
  },
  statusDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(184, 134, 100, 0.2)",
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 12,
    color: "#8b7355",
    marginBottom: 4,
  },

  // Backend Card
  backendCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backendGradient: {
    padding: 20,
  },
  backendHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a3728",
    marginLeft: 12,
  },
  backendInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backendUrl: {
    fontSize: 14,
    color: "#8b7355",
    fontFamily: 'monospace',
    flex: 1,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  copyText: {
    fontSize: 12,
    color: "#8b5a3c",
    marginLeft: 4,
  },

  // Actions Container
  actionsContainer: {
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Manual Setup
  manualSetupCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  manualSetupGradient: {
    padding: 20,
  },
  manualSetupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  manualSetupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a3728",
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#4a3728",
  },
  manualSetupButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  manualSetupButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  manualSetupButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  helpSection: {
    backgroundColor: "rgba(139, 90, 60, 0.05)",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.1)",
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: "#8b7355",
    lineHeight: 18,
  },

  // Help Card
  helpCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  helpGradient: {
    padding: 20,
  },
  helpHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  helpCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a3728",
    marginLeft: 12,
  },
  troubleshootingList: {
    gap: 12,
  },
  troubleshootingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  troubleshootingText: {
    fontSize: 14,
    color: "#8b7355",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});