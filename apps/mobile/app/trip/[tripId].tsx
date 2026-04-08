import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { Card, Button } from '../../src/components/ui';
import { apiClient } from '../../src/api/client';
import { useAuth } from '../../src/contexts/AuthContext';

interface TripDetail {
  id: string;
  title: string | null;
  destination: string;
  city: string | null;
  startDate: string;
  endDate: string;
  duration: number | null;
  budget: number | null;
  currency: string;
  status: string;
  itineraryText?: string;
  funFacts?: Array<{ category: string; content: string }>;
  warnings?: Array<{ title: string; description: string }>;
  createdAt: string;
}

export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrip();
  }, [tripId, token]);

  const loadTrip = async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getTrip(token!, tripId);
      setTrip(data.trip || data);
    } catch (err: any) {
      setError(err.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !tripId) return;

    Alert.alert('刪除行程', '確定要刪除嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deleteTrip(token!, tripId);
            router.back();
          } catch (err: any) {
            Alert.alert('錯誤', err.message);
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!trip) return;
    await Share.share({
      message: `${trip.destination}之旅\n${trip.startDate} - ${trip.endDate}\n\n${trip.itineraryText || ''}`,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || '行程不存在'}</Text>
          <Button title="返回" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleShare}>
            <Text style={styles.actionText}>分享</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={[styles.actionText, { color: '#EF4444' }]}>刪除</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.hero}>
          <Text style={styles.title}>{trip.destination}</Text>
          {trip.city && <Text style={styles.subtitle}>{trip.city}</Text>}
        </View>

        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>出發</Text>
              <Text style={styles.value}>{formatDate(trip.startDate)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>返回</Text>
              <Text style={styles.value}>{formatDate(trip.endDate)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>天數</Text>
              <Text style={styles.value}>{trip.duration} 天</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>預算</Text>
              <Text style={styles.value}>{trip.budget?.toLocaleString()} {trip.currency}</Text>
            </View>
          </View>
        </Card>

        {trip.itineraryText && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>📅 行程安排</Text>
            <Text style={styles.itinerary}>{trip.itineraryText}</Text>
          </Card>
        )}

        {trip.funFacts && trip.funFacts.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>🎯 趣味知識</Text>
            {trip.funFacts.map((fact, i) => (
              <View key={i} style={styles.factItem}>
                <Text style={styles.factCategory}>{fact.category}</Text>
                <Text style={styles.factText}>{fact.content}</Text>
              </View>
            ))}
          </Card>
        )}

        {trip.warnings && trip.warnings.length > 0 && (
          <Card style={[styles.card, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.sectionTitle}>⚠️ 注意事項</Text>
            {trip.warnings.map((w, i) => (
              <View key={i} style={styles.warningItem}>
                <Text style={styles.warningTitle}>{w.title}</Text>
                <Text style={styles.warningText}>{w.description}</Text>
              </View>
            ))}
          </Card>
        )}

        <Text style={styles.created}>建立於 {formatDate(trip.createdAt)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666' },
  errorText: { fontSize: 16, color: '#EF4444', marginBottom: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
  },
  backText: { color: colors.primary, fontSize: 16 },
  actions: { flexDirection: 'row' },
  actionText: { color: colors.primary, fontSize: 16, marginLeft: 16 },
  scrollView: { flex: 1 },
  hero: {
    backgroundColor: colors.primary,
    padding: 24,
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 16, color: 'white', opacity: 0.9, marginTop: 4 },
  card: { margin: 16, marginBottom: 0, padding: 16, backgroundColor: 'white', borderRadius: 12 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap' },
  infoItem: { width: '50%', marginBottom: 12 },
  label: { fontSize: 12, color: '#666' },
  value: { fontSize: 16, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  itinerary: { fontSize: 14, lineHeight: 22 },
  factItem: { marginBottom: 12, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: colors.primary },
  factCategory: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  factText: { fontSize: 14, lineHeight: 20 },
  warningItem: { marginBottom: 12 },
  warningTitle: { fontSize: 15, fontWeight: '600', color: '#D97706' },
  warningText: { fontSize: 14, lineHeight: 20 },
  created: { fontSize: 12, color: '#999', textAlign: 'center', marginVertical: 24 },
});
