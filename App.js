import { StatusBar } from 'expo-status-bar';
// 1. We imported SafeAreaView here
import { StyleSheet, Text, TextInput, Button, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function App() {
  const [flightNumber, setFlightNumber] = useState('');

  const handleSearch = () => {
    if (!flightNumber) {
      Alert.alert("Hold up!", "Please enter a flight number first.");
      return;
    }
    Alert.alert("Success", "Ready to search for: " + flightNumber);
  };


  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
      <Text style={styles.title}>FlightUp</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Paste Flight Number (e.g. AF1234)"
        value={flightNumber}
        onChangeText={setFlightNumber}
      />

      <Button title="Search" onPress={handleSearch} />
      
      <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Tells the container to take up the whole screen
    backgroundColor: '#f5f5f5',
    alignItems: 'center', // Centers horizontally
    justifyContent: 'center', // Centers vertically (this pushes it down from the camera)
    padding: 20,
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
});