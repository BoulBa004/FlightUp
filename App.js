import { StatusBar } from 'expo-status-bar';
// 1. Added View and ActivityIndicator (loading spinner) to the imports
import { StyleSheet, Text, TextInput, Button, Alert, View, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Activate the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';



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
  // Split the string to grab just the "YYYY-MM-DD" portion
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
  
  // 1. Identify the zone and convert to absolute universal time
  const depTime = dayjs.tz(depStr.substring(0, 19), depTz);
  const arrTime = dayjs.tz(arrStr.substring(0, 19), arrTz);
  const now = dayjs(); // Current absolute time
  
  // If the flight hasn't actually taken off yet
  if (now.isBefore(depTime)) return null; 
  
  // 2. Make the necessary calculations (in milliseconds)
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

export default function App() {
  const [flightNumber, setFlightNumber] = useState('');
  const [flightData, setFlightData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {

    Keyboard.dismiss();

    if (!flightNumber.trim()) return;
    
    setIsLoading(true);
    setFlightData(null);
    setError(null); // Clear previous errors

    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${baseUrl}/api/flight/${flightNumber}`);
      
      const json = await response.json();
      
      // AviationStack returns an empty array in `data` if the flight doesn't exist
      if (!json.data || json.data.length === 0) {
        setError({
          icon: '📭',
          title: 'Flight Not Found',
          message: `We couldn't find any active data for ${flightNumber.toUpperCase()}. Double-check the airline code and number.`
        });
        setIsLoading(false);
        return;
      }

      setFlightData(json.data[0]);
    } catch (err) {
      setError({
        icon: '📡',
        title: 'Network Error',
        message: 'Unable to reach the server. Please check your connection and ensure the backend proxy is running.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaProvider>

    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>FlightUp</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Paste Flight Number (e.g. AF1234)"
          value={flightNumber}
          onChangeText={(text) => setFlightNumber(text.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          blurOnSubmit={true}
        />

        {/* 2. If it's loading, show a spinner. If not, show the button. */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button title="Search" onPress={handleSearch} />
        )}


        {/* --- 1. THE NEW EMPTY STATE --- */}
        {!isLoading && !flightData && !error && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🌍</Text>
            <Text style={styles.emptyStateTitle}>Track Any Flight</Text>
            <Text style={styles.emptyStateSubtitle}>
              Enter an airline code and flight number (e.g., AH2701) to see real-time routing and delays.
            </Text>
          </View>
        )}

        {/* --- 2. THE ERROR STATE --- */}
        {!isLoading && error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>{error.icon}</Text>
            <Text style={styles.errorTitle}>{error.title}</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
          </View>
        )}

        {/* --- 3. THE TICKET CARD --- */}
        {/* 3. If we have flightData, draw this Ticket Card on the screen */}
        {flightData && (() => {
          
          // NEW: Feed the raw timestamps into our custom Day.js calculator
          const depDelay = getDelayInfo(
            flightData.departure.scheduled,
            flightData.departure.actual || flightData.departure.estimated
          );
          
          const arrDelay = getDelayInfo(
            flightData.arrival.scheduled,
            flightData.arrival.estimated || flightData.arrival.actual
          );
          
          // NEW: Smarter active check that overrides the lazy API status
          const hasDeparted = !!flightData.departure.actual;
          const hasArrived = !!flightData.arrival.actual;
          const isActive = flightData.flight_status === 'active' || (hasDeparted && !hasArrived);
          
          return (
            <View style={styles.ticketCard}>
              <Text style={styles.airline}>{flightData.airline.name} {flightData.flight.iata}</Text>
              <Text style={[styles.status, isActive && {color: '#007bff'}]}>
                Status: {isActive ? "ACTIVE" : flightData.flight_status.toUpperCase()}
              </Text>

              <View style={styles.routeContainer}>
                
                {/* --- TOP ROW: CITIES --- */}
                <View style={styles.citiesRow}>
                  
                  {/* --- DEPARTURE BLOCK --- */}
                  <View style={styles.cityBlockLeft}>
                    <Text style={styles.cityLabel}>DEPART</Text>
                    <Text style={styles.airportCode}>{flightData.departure.iata}</Text>
                    <Text style={styles.dateText}>{formatDate(flightData.departure.estimated || flightData.departure.scheduled)}</Text>
                    
                    {/* NEW: Use our hasChanged boolean to trigger the strikethrough layout */}
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

                  {/* --- ARRIVAL BLOCK --- */}
                  <View style={styles.cityBlockRight}>
                    <Text style={styles.cityLabel}>ARRIVE</Text>
                    <Text style={styles.airportCode}>{flightData.arrival.iata}</Text>
                    <Text style={styles.dateText}>{formatDate(flightData.arrival.estimated || flightData.arrival.scheduled)}</Text>
                    
                    {/* NEW: Use our hasChanged boolean for Arrival as well */}
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

                {/* --- BOTTOM ROW: FLIGHTAWARE PROGRESS BAR --- */}
                {isActive && (() => {
                  const progress = getFlightProgress(
                    flightData.departure.actual || flightData.departure.estimated,
                    flightData.arrival.estimated || flightData.arrival.scheduled,
                    flightData.departure.timezone, // NEW: Pass departure timezone
                    flightData.arrival.timezone    // NEW: Pass arrival timezone
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
          );
        })()}
        
        <StatusBar style="auto" />
      </SafeAreaView>
      </TouchableWithoutFeedback>
    </SafeAreaProvider>
  );
}

// 4. Added the CSS to make the Ticket Card look great
const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#f5f5f5',
    alignItems: 'center', 
    justifyContent: 'center', // Wait, let's push it to the top so the keyboard doesn't hide it
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    height: 55,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  ticketCard: {
    marginTop: 40,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Shadow for Android
  },
  airline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#28a745', // A nice "success" green
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 5,
    fontWeight: '600',
  },
  cityLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  airportCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
  },
  details: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333',
  },
  scheduledTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textDecorationLine: 'line-through', // This creates the crossed-out effect
    marginTop: 5,
  },
  actualTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545', // Red to immediately highlight the new time
    marginTop: 2,
  },
  delayedTimeContainer: {
    alignItems: 'center',
  },
  delayText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 11,
    color: '#007bff', // Blue to indicate active flight status
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
    borderColor: '#eee',
  },
  totalTimeText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#5a9b2b', // FlightAware Green
    borderRadius: 2,
    position: 'absolute',
  },
  progressPlaneIcon: {
    position: 'absolute',
    fontSize: 22,
    marginLeft: -11, // Keeps the nose of the plane exactly on the percentage line
    top: 0,
    color: '#5a9b2b',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPill: {
    backgroundColor: '#6c8194', // FlightAware Blue/Grey pill
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  progressLabelText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  planeIcon: {
    fontSize: 24,
  },
  emptyStateContainer: {
    flex: 1, // Tells it to fill all the available empty space below the search bar
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: -40, // Pulls it up slightly so it feels perfectly centered
  },
  emptyStateIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22, // Adds breathing room between the lines of text
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
    color: '#d9534f', // A premium, muted red
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
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
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  scheduledTime: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through', // The strikethrough magic
    marginBottom: -2, // Pulls the actual time up slightly so they group together visually
  },
  actualTime: {
    fontSize: 20,
    fontWeight: 'bold',
    // We let the inline style dynamically inject the red or green color here!
  }
});