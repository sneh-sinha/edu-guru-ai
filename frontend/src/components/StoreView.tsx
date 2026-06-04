import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';

interface StoreViewProps {
  user: any;
  onClose: () => void;
  onCoinsUpdated: (newTotal: number) => void;
}

export default function StoreView({ user, onClose, onCoinsUpdated }: StoreViewProps) {
  const [coins, setCoins] = useState(user.coins || 0);

  const shopItems = [
    { id: 'avatar_1', title: 'Einstein Avatar', type: 'Avatar', price: 100, icon: '👨‍🔬' },
    { id: 'avatar_2', title: 'Robot Teacher', type: 'Avatar', price: 150, icon: '🤖' },
    { id: 'theme_1', title: 'Neon Hacker Theme', type: 'Theme', price: 300, icon: '🟩' },
    { id: 'badge_1', title: 'Genius Badge', type: 'Badge', price: 500, icon: '🏅' },
  ];

  const handlePurchase = (item: any) => {
    if (coins >= item.price) {
      const newCoins = coins - item.price;
      setCoins(newCoins);
      onCoinsUpdated(newCoins);
      // In a real app, we would make an API call to unlock the item in the DB.
      Alert.alert('Purchase Successful!', `You have unlocked the ${item.title}.`);
    } else {
      Alert.alert('Not Enough Coins', 'Keep answering questions to earn more Brain Coins!');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backBtnText}>◀ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coin Shop</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.coinText}>{coins}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Unlock Premium Gear</Text>
          <Text style={styles.heroSub}>Answer questions and complete quizzes to earn coins. Spend them here on new avatars and themes!</Text>
        </View>

        <View style={styles.grid}>
          {shopItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemIconContainer}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemType}>{item.type}</Text>
              
              <TouchableOpacity 
                style={[styles.buyBtn, coins < item.price && styles.buyBtnDisabled]} 
                onPress={() => handlePurchase(item)}
              >
                <Text style={styles.buyBtnText}>🪙 {item.price}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#161B26',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#0B0F19',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  coinEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  coinText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
  },
  heroSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSub: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemCard: {
    width: '47%',
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  itemIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0B0F19',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  itemIcon: {
    fontSize: 32,
  },
  itemTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  itemType: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 16,
  },
  buyBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyBtnDisabled: {
    opacity: 0.5,
  },
  buyBtnText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 14,
  }
});
