import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About FlightUp</Text>
      
      <Text style={styles.bodyText}>
        FlightUp is a secure, cross-platform flight tracking engine built for high-speed data retrieval. 
        Powered by Aviationstack and a custom cloud proxy infrastructure.
      </Text>

      {/* The Router Link to go back home */}
      <Link href="/" style={styles.linkButton}>
        <Text style={styles.linkText}>← Back to Radar</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14', // Midnight Radar Background
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF', // Electric Cyan
    marginBottom: 20,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 16,
    color: '#A0AAB5', // Radar Gray
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
  },
  linkButton: {
    alignSelf: 'center',
    padding: 15,
    borderColor: '#00FFFF',
    borderWidth: 1,
    borderRadius: 8,
  },
  linkText: {
    color: '#00FFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});