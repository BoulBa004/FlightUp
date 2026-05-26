import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Animated, Button, ScrollView, RefreshControl, useWindowDimensions} from 'react-native';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { COLORS } from '../constants/theme';
import { Link } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Activate the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const formatTime = (dateString) => {
  if (!dateString) return "TBD";
  const timePart = dateString.split('T')[1]; 
  if (!timePart) return "TBD";
  const rawTime = timePart.substring(0, 5); 
  const [hours, minutes] = rawTime.split(':');
  let hourNum = parseInt(hours, 10);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  hourNum = hourNum % 12 || 12; 
  return `${hourNum}:${minutes} ${ampm}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

const getDelayInfo = (scheduledStr, actualStr) => {
  if (!scheduledStr || !actualStr) {
    return { text: 'On Time', color: '#5a9b2b', hasChanged: false };
  }

  const scheduled = dayjs(scheduledStr.substring(0, 19));
  const actual = dayjs(actualStr.substring(0, 19));
  const diffMinutes = actual.diff(scheduled, 'minute');

  if (diffMinutes > 0) {
    return { text: `${diffMinutes} min late`, color: '#d9534f', hasChanged: true };
  } else if (diffMinutes < 0) {
    return { text: `${Math.abs(diffMinutes)} min early`, color: '#5a9b2b', hasChanged: true };
  } else {
    return { text: 'On Time', color: '#5a9b2b', hasChanged: false };
  }
};

const getFlightProgress = (depStr, arrStr, depTz, arrTz) => {
  if (!depStr || !arrStr || !depTz || !arrTz) return null;
  
  const depTime = dayjs.tz(depStr.substring(0, 19), depTz);
  const arrTime = dayjs.tz(arrStr.substring(0, 19), arrTz);
  const now = dayjs(); 
  
  if (now.isBefore(depTime)) return null; 
  
  const totalMs = Math.max(0, arrTime.diff(depTime));
  const elapsedMs = Math.max(0, Math.min(now.diff(depTime), totalMs)); 
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  
  const percentage = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 100;
  
  const formatMs = (ms) => {
    const totalMins = Math.floor(ms / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return { 
    elapsed: formatMs(elapsedMs), 
    remaining: formatMs(remainingMs),
    total: formatMs(totalMs),
    percentage: percentage 
  };
};

const SkeletonCard = () => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.ticketCard, { opacity: fadeAnim }]}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonSubHeader} />
      <View style={styles.citiesRow}>
        <View style={styles.skeletonCityBlockLeft}>
          <View style={styles.skeletonLabel} />
          <View style={styles.skeletonCode} />
          <View style={styles.skeletonTime} />
        </View>
        <View style={styles.skeletonCityBlockRight}>
          <View style={styles.skeletonLabel} />
          <View style={styles.skeletonCode} />
          <View style={styles.skeletonTime} />
        </View>
      </View>
      <View style={styles.progressSection}>
        <View style={styles.skeletonProgressBar} />
      </View>
    </Animated.View>
  );
};

export default function App() {
  const [flightNumber, setFlightNumber] = useState('');
  const [flightData, setFlightData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // NEW: Responsive Screen Detection
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Standard tablet/desktop breakpoint

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem('flightup_history');
        if (saved) setRecentSearches(JSON.parse(saved));
      } catch (e) { console.error('Failed to load history', e); }
    };
    loadHistory();
  }, []);

  const saveSearchToHistory = async (flightNum) => {
    try {
      const upperFlight = flightNum.toUpperCase();
      const updatedHistory = [upperFlight, ...recentSearches.filter(f => f !== upperFlight)].slice(0, 5);
      
      setRecentSearches(updatedHistory);
      await AsyncStorage.setItem('flightup_history', JSON.stringify(updatedHistory));
    } catch (e) { console.error('Failed to save history', e); }
  };

  // UPDATED: Smart handler that accepts either a boolean (refresh) or a string (history chip)
  const handleSearch = async (inputParam) => {
    Keyboard.dismiss();
    
    // 1. Determine exactly what triggered this search
    const isRefresh = inputParam === true;
    const targetFlight = typeof inputParam === 'string' ? inputParam : flightNumber;

    if (!targetFlight || !targetFlight.trim()) return;

    // 2. Route the visual loading state correctly
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
      setFlightData(null); 
    }
    
    setError(null);

    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL;
      // 3. Fetch using the correct target flight
      const response = await fetch(`${baseUrl}/api/flight/${targetFlight.toUpperCase()}`);
      const json = await response.json();
      
      saveSearchToHistory(targetFlight);
      
      // If a chip was pressed, update the text input box visually
      if (typeof inputParam === 'string') {
        setFlightNumber(targetFlight.toUpperCase());
      }
      
      if (!json.data || json.data.length === 0) {
        setError({
          icon: '📭',
          title: 'Flight Not Found',
          message: `We couldn't find any active data for ${targetFlight.toUpperCase()}. Double-check the airline code.`
        });
        return;
      }

      setFlightData(json.data[0]);
    } catch (err) {
      setError({
        icon: '📡',
        title: 'Network Error',
        message: 'Unable to reach the server. Please check your connection.'
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>FlightUp</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Paste Flight Number (e.g. AH1234)"
          value={flightNumber}
          onChangeText={(text) => setFlightNumber(text.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          blurOnSubmit={true}
        />

        <Button title="Search" onPress={handleSearch} disabled={isLoading} />

        {recentSearches.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Searches</Text>
            <View style={styles.historyRow}>
              {recentSearches.map((flight) => (
                <TouchableOpacity 
                  key={flight} 
                  style={styles.historyChip}
                  onPress={() => {
                    // UPDATED: Pass the string directly into the smart handler
                    handleSearch(flight); 
                  }}
                >
                  <Text style={styles.historyChipText}>{flight}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <ScrollView 
          style={{ width: '100%' }} 
          contentContainerStyle={{ flexGrow: 1 }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical={true}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => handleSearch(true)} 
              tintColor="#007bff" 
            />
          }
        >

        {isLoading && (
          <SkeletonCard />
        )}

        {!isLoading && !flightData && !error && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🌍</Text>
            <Text style={styles.emptyStateTitle}>Track Any Flight</Text>
            <Text style={styles.emptyStateSubtitle}>
              Enter an airline code and flight number (e.g., AH2701) to see real-time routing and delays.
            </Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>{error.icon}</Text>
            <Text style={styles.errorTitle}>{error.title}</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
          </View>
        )}

        {flightData && (() => {
          const depDelay = getDelayInfo(
            flightData.departure.scheduled,
            flightData.departure.actual || flightData.departure.estimated
          );
          
          const arrDelay = getDelayInfo(
            flightData.arrival.scheduled,
            flightData.arrival.estimated || flightData.arrival.actual
          );
          
          const hasDeparted = !!flightData.departure.actual;
          const hasArrived = !!flightData.arrival.actual;
          const isActive = flightData.flight_status === 'active' || (hasDeparted && !hasArrived);
          
          return (
            // NEW: The dynamic wrapper that shifts between row and column
            <View style={[styles.resultsWrapper, isDesktop ? styles.resultsWrapperDesktop : styles.resultsWrapperMobile]}>
              
              {/* PRIMARY TICKET CARD */}
              <View style={[styles.ticketCard, isDesktop && styles.ticketCardDesktop]}>
                <Text style={styles.airline}>{flightData.airline.name} {flightData.flight.iata}</Text>
                <Text style={[styles.status, isActive && {color: '#007bff'}]}>
                  Status: {isActive ? "ACTIVE" : flightData.flight_status.toUpperCase()}
                </Text>

                <View style={styles.routeContainer}>
                  
                  <View style={styles.citiesRow}>
                    
                    <View style={styles.cityBlockLeft}>
                      <Text style={styles.cityLabel}>DEPART</Text>
                      <Text style={styles.airportCode}>{flightData.departure.iata}</Text>
                      <Text style={styles.dateText}>{formatDate(flightData.departure.estimated || flightData.departure.scheduled)}</Text>
                      
                      {depDelay.hasChanged ? (
                        <View style={styles.timeStackLeft}>
                          <Text style={styles.scheduledTime}>{formatTime(flightData.departure.scheduled)}</Text>
                          <Text style={[styles.actualTime, { color: depDelay.color }]}>
                            {formatTime(flightData.departure.actual || flightData.departure.estimated || flightData.departure.scheduled)}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.timeText}>{formatTime(flightData.departure.scheduled)}</Text>
                      )}

                      <Text style={styles.details}>Gate: {flightData.departure.gate || "TBD"}</Text>
                      <Text style={[styles.delayText, { color: depDelay.color }]}>{depDelay.text}</Text>
                    </View>

                    <View style={styles.cityBlockRight}>
                      <Text style={styles.cityLabel}>ARRIVE</Text>
                      <Text style={styles.airportCode}>{flightData.arrival.iata}</Text>
                      <Text style={styles.dateText}>{formatDate(flightData.arrival.estimated || flightData.arrival.scheduled)}</Text>
                      
                      {arrDelay.hasChanged ? (
                        <View style={styles.timeStackRight}>
                          <Text style={styles.scheduledTime}>{formatTime(flightData.arrival.scheduled)}</Text>
                          <Text style={[styles.actualTime, { color: arrDelay.color }]}>
                            {formatTime(flightData.arrival.actual || flightData.arrival.estimated || flightData.arrival.scheduled)}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.timeText}>{formatTime(flightData.arrival.scheduled)}</Text>
                      )}

                      <Text style={styles.details}>Term: {flightData.arrival.terminal || "TBD"}</Text>
                      <Text style={[styles.delayText, { color: arrDelay.color }]}>{arrDelay.text}</Text>
                    </View>
                    
                  </View>

                  {isActive && (() => {
                    const progress = getFlightProgress(
                      flightData.departure.actual || flightData.departure.estimated,
                      flightData.arrival.estimated || flightData.arrival.scheduled,
                      flightData.departure.timezone, 
                      flightData.arrival.timezone    
                    );
                    return progress ? (
                      <View style={styles.progressSection}>
                        <Text style={styles.totalTimeText}>{progress.total} total travel time</Text>
                        
                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBarBackground} />
                          <View style={[styles.progressBarFill, { width: `${progress.percentage}%` }]} />
                          <Text style={[styles.progressPlaneIcon, { left: `${progress.percentage}%` }]}>✈️</Text>
                        </View>
                        
                        <View style={styles.progressLabels}>
                          <View style={styles.progressPill}>
                            <Text style={styles.progressLabelText}>{progress.elapsed} elapsed</Text>
                          </View>
                          <View style={styles.progressPill}>
                            <Text style={styles.progressLabelText}>{progress.remaining} remaining</Text>
                          </View>
                        </View>
                      </View>
                    ) : null;
                  })()}

                </View>
              </View>

              {/* NEW: THE DESKTOP-ONLY SIDE PANEL PLACEHOLDER */}
              {isDesktop && (
                <View style={styles.sidePanelDesktop}>
                  <Text style={styles.sidePanelTitle}>Flight Metadata</Text>
                  <Text style={styles.sidePanelText}>Logo & deeper details will mount here.</Text>
                </View>
              )}

            </View>
            
          );
        })()}

        <View style={styles.navFooter}>
          <Link href="/about" style={styles.navLink}>
            <Text style={styles.navText}>About</Text>
          </Link>
          <Text style={styles.navSeparator}>|</Text>
          <Link href="/contact" style={styles.navLink}>
            <Text style={styles.navText}>Contact</Text>
          </Link>
        </View>

        </ScrollView>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: COLORS.background,
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 40,
    color: COLORS.textMain,
  },
  input: {
    height: 55,
    width: '100%',
    borderColor: 'rgba(255,255,255,0.1)', 
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: COLORS.surface,
    color: COLORS.textMain, 
    marginBottom: 20,
  },
// NEW: Responsive Grid Wrappers
  resultsWrapper: {
    width: '100%',
    marginTop: 40,
    gap: 20, // Adds clean spacing between the card and the panel
  },
  resultsWrapperDesktop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  resultsWrapperMobile: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  
  // UPDATED: Ticket Card (Removed the hardcoded marginTop)
  ticketCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, 
    shadowRadius: 4,
    elevation: 3, 
  },
  ticketCardDesktop: {
    flex: 2, // Tells the card to take up roughly 66% of the screen
    maxWidth: 800,
  },

  // NEW: Temporary Desktop Panel Style
  sidePanelDesktop: {
    flex: 1, // Tells the panel to take up the remaining 33%
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    minWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.2)', // Soft electric cyan border
  },
  sidePanelTitle: {
    color: '#00FFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sidePanelText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  airline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textMain,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: COLORS.statusGood, 
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 5,
    fontWeight: '600',
  },
  cityLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 5,
  },
  airportCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textMain,
  },
  details: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 5,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 20, 
    fontWeight: 'bold',
    marginTop: 5,
    marginVertical: 4,
    color: COLORS.textMain,
  },
  scheduledTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textDecorationLine: 'line-through', 
    marginTop: 5,
    marginBottom: -2,
  },
  actualTime: {
    fontSize: 20, 
    fontWeight: 'bold',
    color: COLORS.statusBad, 
    marginTop: 2,
  },
  delayedTimeContainer: {
    alignItems: 'center',
  },
  delayText: {
    fontSize: 12,
    color: COLORS.statusBad, 
    marginTop: 4,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 11,
    color: COLORS.primary, 
    fontWeight: '700',
    marginTop: 2,
  },
  routeContainer: {
    width: '100%',
    marginTop: 10,
  },
  citiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  cityBlockLeft: {
    alignItems: 'flex-start',
  },
  cityBlockRight: {
    alignItems: 'flex-end',
  },
  delayedTimeContainerLeft: {
    alignItems: 'flex-start',
  },
  delayedTimeContainerRight: {
    alignItems: 'flex-end',
  },
  progressSection: {
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', 
  },
  totalTimeText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: COLORS.primary, 
    borderRadius: 2,
    position: 'absolute',
  },
  progressPlaneIcon: {
    position: 'absolute',
    fontSize: 22,
    marginLeft: -11, 
    top: 0,
    color: COLORS.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPill: {
    backgroundColor: COLORS.secondary, 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  progressLabelText: {
    fontSize: 11,
    color: COLORS.textMain,
    fontWeight: 'bold',
  },
  planeIcon: {
    fontSize: 24,
    color: COLORS.textMain,
  },
  emptyStateContainer: {
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: -40, 
  },
  emptyStateIcon: {
    fontSize: 72,
    marginBottom: 20,
    color: COLORS.textMuted, 
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textMain,
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22, 
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: -40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.statusBad, 
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  timeStackLeft: {
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  timeStackRight: {
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  skeletonHeader: {
    height: 24,
    width: '60%',
    backgroundColor: '#2A364F', 
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubHeader: {
    height: 16,
    width: '40%',
    backgroundColor: '#2A364F',
    borderRadius: 4,
    marginBottom: 20,
  },
  skeletonCityBlockLeft: {
    alignItems: 'flex-start',
  },
  skeletonCityBlockRight: {
    alignItems: 'flex-end',
  },
  skeletonLabel: {
    height: 12,
    width: 50,
    backgroundColor: '#2A364F',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonCode: {
    height: 32,
    width: 80,
    backgroundColor: '#2A364F',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTime: {
    height: 20,
    width: 60,
    backgroundColor: '#2A364F',
    borderRadius: 4,
  },
  skeletonProgressBar: {
    height: 8,
    width: '100%',
    backgroundColor: '#2A364F',
    borderRadius: 4,
    marginTop: 15,
  },
  navFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  navLink: {
    paddingHorizontal: 15,
  },
  navText: {
    color: '#A0AAB5', 
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  navSeparator: {
    color: '#00FFFF',
    fontSize: 16,
  },
  historyContainer: {
    marginTop: 30,
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  historyTitle: {
    color: '#A0AAB5', 
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  historyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  historyChip: {
    backgroundColor: '#1A2130',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderColor: '#00FFFF', 
    borderWidth: 1,
  },
  historyChipText: {
    color: '#00FFFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});