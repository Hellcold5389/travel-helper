import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../src/theme/colors';
import { Card, Button } from '../src/components/ui';
import { useAuth } from '../src/contexts/AuthContext';
import { apiClient } from '../src/api/client';

interface Passport {
  id: string;
  countryCode: string;
  countryName: string;
  passportNumber: string;
  issueDate: string;
  expiryDate: string;
  nationality: string;
  notes?: string;
}

export default function PassportScreen() {
  const { user, token, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [passports, setPassports] = useState<Passport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [countryCode, setCountryCode] = useState('TW');
  const [passportNumber, setPassportNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [nationality, setNationality] = useState('台灣');
  
  // Country options
  const countries = [
    { code: 'TW', name: '台灣' },
    { code: 'HK', name: '香港' },
    { code: 'MO', name: '澳門' },
    { code: 'JP', name: '日本' },
    { code: 'KR', name: '韓國' },
    { code: 'US', name: '美國' },
    { code: 'SG', name: '新加坡' },
  ];

  useEffect(() => {
    if (isAuthenticated && token) {
      loadPassports();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const loadPassports = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.0.26:3001/api/user/passport', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPassports(data.passports || []);
    } catch (error) {
      console.error('Load passports error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!passportNumber || !expiryDate) {
      Alert.alert('錯誤', '請填寫護照號碼和到期日期');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('http://192.168.0.26:3001/api/user/passport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          countryCode,
          passportNumber,
          issueDate,
          expiryDate,
          nationality,
        }),
      });
      
      if (response.ok) {
        Alert.alert('成功', '護照已添加');
        setShowForm(false);
        setPassportNumber('');
        setIssueDate('');
        setExpiryDate('');
        loadPassports();
      } else {
        Alert.alert('錯誤', '添加失敗');
      }
    } catch (error) {
      Alert.alert('錯誤', '網絡錯誤');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (passportId: string) => {
    Alert.alert('刪除護照', '確定要刪除嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`http://192.168.0.26:3001/api/user/passport/${passportId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            loadPassports();
          } catch (error) {
            Alert.alert('錯誤', '刪除失敗');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return { text: '已過期', color: '#EF4444' };
    if (days < 30) return { text: `${days} 天後過期`, color: '#F59E0B' };
    if (days < 180) return { text: `${days} 天後過期`, color: '#10B981' };
    return { text: `${days} 天後過期`, color: '#6B7280' };
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>請先登錄以管理護照</Text>
          <Button title="登錄" onPress={() => router.push('/login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛂 護照管理</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addButton}>{showForm ? '取消' : '+ 添加'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
        ) : (
          <>
            {/* Add Passport Form */}
            {showForm && (
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>添加護照</Text>
                
                <Text style={styles.label}>國籍</Text>
                <View style={styles.picker}>
                  {countries.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={[
                        styles.pickerOption,
                        countryCode === c.code && styles.pickerOptionSelected,
                      ]}
                      onPress={() => setCountryCode(c.code)}
                    >
                      <Text style={[
                        styles.pickerText,
                        countryCode === c.code && styles.pickerTextSelected,
                      ]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>護照號碼</Text>
                <TextInput
                  style={styles.input}
                  value={passportNumber}
                  onChangeText={setPassportNumber}
                  placeholder="例如: 123456789"
                  autoCapitalize="characters"
                />

                <Text style={styles.label}>發行日期 (可選)</Text>
                <TextInput
                  style={styles.input}
                  value={issueDate}
                  onChangeText={setIssueDate}
                  placeholder="YYYY-MM-DD"
                />

                <Text style={styles.label}>到期日期</Text>
                <TextInput
                  style={styles.input}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="YYYY-MM-DD"
                />

                <Button
                  title={saving ? '保存中...' : '保存'}
                  onPress={handleSave}
                  disabled={saving}
                  style={styles.saveButton}
                />
              </Card>
            )}

            {/* Passport List */}
            {passports.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛂</Text>
                <Text style={styles.emptyText}>尚無護照資料</Text>
                <Text style={styles.emptySubtext}>添加護照以獲得到期提醒</Text>
              </View>
            ) : (
              passports.map((passport) => {
                const status = getExpiryStatus(passport.expiryDate);
                return (
                  <Card key={passport.id} style={styles.card}>
                    <View style={styles.passportHeader}>
                      <Text style={styles.passportCountry}>
                        {countries.find(c => c.code === passport.countryCode)?.name || passport.countryCode}
                      </Text>
                      <TouchableOpacity onPress={() => handleDelete(passport.id)}>
                        <Text style={styles.deleteText}>刪除</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.passportInfo}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>護照號碼</Text>
                        <Text style={styles.infoValue}>{passport.passportNumber}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>到期日期</Text>
                        <Text style={styles.infoValue}>{formatDate(passport.expiryDate)}</Text>
                      </View>
                    </View>
                    
                    <View style={[styles.expiryStatus, { backgroundColor: status.color + '20' }]}>
                      <Text style={[styles.expiryText, { color: status.color }]}>
                        {status.text}
                      </Text>
                    </View>
                  </Card>
                );
              })
            )}

            {/* Tips */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>💡 提醒</Text>
              <Text style={styles.tipText}>
                • 護照有效期少於 6 個月可能無法入境部分國家{'\n'}
                • 建議提前 3-6 個月辦理換發{'\n'}
                • 我們會在護照到期前發送提醒通知
              </Text>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loginPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginPromptText: { fontSize: 16, color: '#666', marginBottom: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  addButton: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  loading: { marginTop: 40 },
  card: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 14, color: '#666', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  picker: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  pickerOptionSelected: { backgroundColor: colors.primary },
  pickerText: { fontSize: 14, color: '#333' },
  pickerTextSelected: { color: 'white', fontWeight: '500' },
  saveButton: { marginTop: 16 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#666' },
  passportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passportCountry: { fontSize: 18, fontWeight: '600' },
  deleteText: { color: '#EF4444', fontSize: 14 },
  passportInfo: { marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: { color: '#666' },
  infoValue: { fontWeight: '500' },
  expiryStatus: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  expiryText: { fontWeight: '600' },
  tipText: { fontSize: 14, lineHeight: 22, color: '#666' },
});
