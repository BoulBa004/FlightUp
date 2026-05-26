import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function ContactScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Support</Text>
      
      <Text style={styles.bodyText}>
        Experiencing radar anomalies or API connection issues? 
        Reach out to our engineering team for immediate assistance.
      </Text>
      
      <Text style={styles.emailText}>support@flightup.io</Text>

      <Link href="/" style={styles.linkButton}>
        <Text style={styles.linkText}>← Back to Radar</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 16,
    color: '#A0AAB5',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  emailText: {
    fontSize: 18,
    color: '#00FFFF',
    fontWeight: 'bold',
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