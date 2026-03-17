import { View, Text, StyleSheet } from 'react-native';

export default function VisaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Visa Requirements</Text>
      <Text style={styles.comingSoon}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  comingSoon: {
    fontSize: 16,
    color: '#666',
  },
});