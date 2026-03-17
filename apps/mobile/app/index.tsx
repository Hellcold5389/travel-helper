import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌍 Travel Helper</Text>
      <Text style={styles.subtitle}>Your AI Travel Companion</Text>

      <View style={styles.menu}>
        <Link href="/trip" asChild>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>✈️</Text>
            <Text style={styles.menuText}>Plan a Trip</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/visa" asChild>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>Visa Requirements</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/legal" asChild>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>⚖️</Text>
            <Text style={styles.menuText}>Legal & Restrictions</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Text style={styles.footer}>
        Powered by AI • Made with ❤️
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  menu: {
    width: '100%',
    gap: 16,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  menuText: {
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 20,
    color: '#999',
    fontSize: 12,
  },
});