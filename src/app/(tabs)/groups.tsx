import { useState, useEffect } from 'react';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, FlatList, Pressable, TextInput, Alert, InteractionManager, Modal, ScrollView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/store';
import { WalletService } from '../../services/wallet.service';
import { PaymentService } from '../../services/payment.service';
import { ApiService } from '../../services/api.service';
import { uploadImageToCloudinary } from '../../services/image.service';
import { detectSeeker } from '../../services/seeker';
import { PROGRAM_ID } from '../../config/solana';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../config/theme';
import { PLATFORM_CREATE_FEE, PLATFORM_PAYMENT_ADDRESS, DEFAULT_JOIN_PAYMENT_ADDRESS, PLATFORM_JOIN_FEE_PERCENTAGE } from '../../config/platform';

/**
 * Groups Screen - Create and manage Mastermind groups
 * Includes wallet verification functionality for Solana wallet integration
 */
export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const verifiedAddress = useAppStore((s) => s.verifiedAddress);
  const setVerified = useAppStore((s) => s.setVerified);
  const disconnectWallet = useAppStore((s) => s.disconnectWallet);
  const username = useAppStore((s) => s.username);
  const usernameSet = useAppStore((s) => s.usernameSet);
  const xHandle = useAppStore((s) => s.xHandle);
  const verified = useAppStore((s) => s.verified);
  const setUsername = useAppStore((s) => s.setUsername);
  const syncXAccount = useAppStore((s) => s.syncXAccount);
  const groups = useAppStore((s) => s.groups);
  const publicGroups = useAppStore((s) => s.publicGroups);
  const createPublicGroup = useAppStore((s) => s.createPublicGroup);
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const deletePublicGroup = useAppStore((s) => s.deletePublicGroup);
  const fetchPublicGroups = useAppStore((s) => s.fetchPublicGroups);
  const joinPublicGroup = useAppStore((s) => s.joinPublicGroup);
  const updateGroupJoinPrice = useAppStore((s) => s.updateGroupJoinPrice);
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username || '');
  const [showEditModal, setShowEditModal] = useState(false);
  const [syncingX, setSyncingX] = useState(false);
  const [tempXHandle, setTempXHandle] = useState(xHandle || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [publicGroupName, setPublicGroupName] = useState('');
  const [publicGroupDescription, setPublicGroupDescription] = useState('');
  const [publicGroupJoinPrice, setPublicGroupJoinPrice] = useState('0');
  const [publicGroupCategory, setPublicGroupCategory] = useState<string>('');
  const [publicGroupBackgroundImage, setPublicGroupBackgroundImage] = useState<string | null>(null);
  // Default payment address to user's connected wallet address
  const [publicGroupPaymentAddress, setPublicGroupPaymentAddress] = useState(
    verifiedAddress || DEFAULT_JOIN_PAYMENT_ADDRESS
  );
  
  // Update payment address when wallet connects/disconnects
  useEffect(() => {
    if (verifiedAddress) {
      setPublicGroupPaymentAddress(verifiedAddress);
    } else {
      setPublicGroupPaymentAddress(DEFAULT_JOIN_PAYMENT_ADDRESS);
    }
  }, [verifiedAddress]);
  const [isCreatingPublic, setIsCreatingPublic] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  type GroupForDisplay = {
    id: string;
    name: string;
    ownerAddress: string;
    ownerUsername?: string;
    createdAt: string;
    joinPrice: number;
    paymentAddress: string;
    description?: string;
    memberCount?: number;
    backgroundImage?: string;
    category?: string;
  };
  
  const [selectedGroup, setSelectedGroup] = useState<GroupForDisplay | null>(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [editingJoinPriceGroupId, setEditingJoinPriceGroupId] = useState<string | null>(null);
  const [newJoinPrice, setNewJoinPrice] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupImage, setEditingGroupImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingGroupPrice, setEditingGroupPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isMemberOfSelectedGroup, setIsMemberOfSelectedGroup] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [deletingGroupName, setDeletingGroupName] = useState<string>('');
  const [verifyingDelete, setVerifyingDelete] = useState(false);
  const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null);
  const [verifyingLeave, setVerifyingLeave] = useState(false);
  const [myMastermindsGroups, setMyMastermindsGroups] = useState<any[]>([]);
  const apiService = new ApiService();
  const seeker = detectSeeker();
  const useSiws = seeker.isSeeker && (process.env.EXPO_PUBLIC_USE_SIWS === '1' || process.env.EXPO_PUBLIC_USE_SIWS === 'true');

  // Filter groups by selected category and deduplicate by ID
  const allGroups = Array.from(
    new Map(publicGroups.map(g => [g.id, g])).values()
  );
  
  const filteredGroups = selectedCategory 
    ? allGroups.filter(g => g.category === selectedCategory)
    : allGroups;
  
  // Debug logging to help diagnose category filter issues
  // Only log once to avoid spam
  useEffect(() => {
    if (selectedCategory && filteredGroups.length === 0 && allGroups.length > 0) {
      console.log('[Groups] Category filter issue - groups have undefined category:', {
        selectedCategory,
        totalGroups: allGroups.length,
        groupsWithCategories: allGroups.map(g => ({ id: g.id, name: g.name, category: g.category }))
      });
    }
  }, [selectedCategory, filteredGroups.length, allGroups.length]);
  
  const displayGroups = filteredGroups;

  // Sync tempUsername with store username when it changes
  useEffect(() => {
    if (!editingUsername) {
      setTempUsername(username || '');
    }
  }, [username, editingUsername]);

  // Sync tempXHandle with store xHandle when it changes
  useEffect(() => {
    if (!syncingX) {
      setTempXHandle(xHandle || '');
    }
  }, [xHandle, syncingX]);

  // Update My Masterminds groups when groups, publicGroups, or verifiedAddress changes
  useEffect(() => {
    const checkMembership = async () => {
      if (!verifiedAddress) {
        setMyMastermindsGroups([]);
        return;
      }

      const filteredGroups = [];
      for (const g of groups) {
        if (!g.isPublic) continue;
        
        // Check if this group exists in publicGroups (backend)
        const existsInBackend = publicGroups.some(pg => 
          pg.id === (g as any).apiGroupId || 
          pg.id === g.id ||
          (pg as any).apiGroupId === g.id
        );
        if (!existsInBackend) continue;
        
        // User is owner - always show
        if (g.ownerAddress === verifiedAddress) {
          filteredGroups.push(g);
          continue;
        }
        
        // Check if user is a member (from local database)
        try {
          const { dbApi } = await import('../../state/dbApi');
          const member = await dbApi.getMember(g.id, verifiedAddress);
          if (member) {
            filteredGroups.push(g);
          }
        } catch (error) {
          console.error('[Groups] Error checking membership for My Masterminds:', error);
        }
      }
      setMyMastermindsGroups(filteredGroups);
    };

    checkMembership();
  }, [groups, publicGroups, verifiedAddress]);

  // Fetch public groups on mount
  useEffect(() => {
    if (verifiedAddress) {
      // Fetch groups with current category filter if active
      if (selectedCategory) {
        fetchPublicGroups(selectedCategory);
      } else {
        fetchPublicGroups();
      }
    }
  }, [verifiedAddress, fetchPublicGroups, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh with current category filter if active
    if (selectedCategory) {
      await fetchPublicGroups(selectedCategory);
    } else {
      await fetchPublicGroups();
    }
    setRefreshing(false);
  };

  /**
   * Pick background image for group card and upload to Cloudinary
   * Optimized for mobile with proper aspect ratio
   * Uses lazy import to avoid native module errors during development
   */
  const pickBackgroundImage = async (forEdit: boolean = false) => {
    try {
      // Lazy import ImagePicker to avoid native module errors if not rebuilt
      const ImagePickerModule = await import('expo-image-picker');
      // expo-image-picker exports functions directly, not as a default object
      const {
        requestMediaLibraryPermissionsAsync,
        launchImageLibraryAsync,
        MediaTypeOptions
      } = ImagePickerModule;
      
      // Check if functions are available
      if (!requestMediaLibraryPermissionsAsync || !launchImageLibraryAsync) {
        throw new Error('Image picker native module not available. Please rebuild your app.');
      }
      
      // Request permission
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }

      // Launch image picker
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions?.Images || 'images',
        allowsEditing: true,
        aspect: [16, 9], // Optimized for mobile cards (landscape)
        quality: 0.8, // Good balance between quality and file size
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        
        // Upload to Cloudinary
        setUploadingImage(true);
        try {
          const publicUrl = await uploadImageToCloudinary(localUri);
          
          if (forEdit) {
            setEditingGroupImage(publicUrl);
          } else {
            setPublicGroupBackgroundImage(publicUrl);
          }
        } catch (uploadError: any) {
          console.error('[Groups] Upload error:', uploadError);
          Alert.alert('Upload Failed', uploadError.message || 'Failed to upload image. Please try again.');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error: any) {
      console.error('[Groups] Error picking image:', error);
      setUploadingImage(false);
      // If native module not available, show helpful message
      if (error.message?.includes('native module') || 
          error.message?.includes('ExponentImagePicker') ||
          error.message?.includes('not available')) {
        Alert.alert(
          'Image Picker Not Available',
          'Please rebuild your app to enable image picker. Run: npx expo prebuild --clean'
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to pick image. Please try again.');
      }
    }
  };

  const handleJoinPublicGroup = async (group: typeof publicGroups[0]) => {
    if (!verifiedAddress) {
      Alert.alert('Wallet Required', 'Please verify your wallet first.');
      return;
    }

    // Check if already a member (skip for mock groups)
    // Always check local membership for real groups
    {
      // Check local membership first
      const { dbApi } = await import('../../state/dbApi');
      const existingMember = await dbApi.getMember(group.id, verifiedAddress);
      
      if (existingMember) {
        // User is already a member - check if they need to pay again
        const currentJoinPrice = group.joinPrice || 0;
        
        // If they joined when it was free, they stay free
        if (existingMember.joinPricePaid === 0 && currentJoinPrice === 0) {
          Alert.alert('Already a Member', 'You are already a member of this group.');
          return;
        }
        
        // If they joined when it was free but group is now paid, they need to pay to rejoin
        if (existingMember.joinPricePaid === 0 && currentJoinPrice > 0) {
          // User left and needs to pay to rejoin - continue with payment flow below
          // Delete their old membership record so they can rejoin with payment
          const { dbApi } = await import('../../state/dbApi');
          const { run } = await import('../../db/client');
          await run('DELETE FROM mastermind_members WHERE groupId=? AND userAddress=?', [group.id, verifiedAddress]);
          // Continue with payment flow below - don't return
        } else if (existingMember.joinPricePaid > 0 && existingMember.joinPricePaid === currentJoinPrice) {
          // They already paid the current price - they're a member
          Alert.alert('Already a Member', 'You are already a member of this group.');
          return;
        } else if (existingMember.joinPricePaid > 0 && existingMember.joinPricePaid !== currentJoinPrice) {
          // Price changed - they need to pay the new price to rejoin
          const { run } = await import('../../db/client');
          await run('DELETE FROM mastermind_members WHERE groupId=? AND userAddress=?', [group.id, verifiedAddress]);
          // Continue with payment flow below - don't return
        }
      } else {
        // Not a local member, check API
        const isMember = await apiService.checkMembership(group.id, verifiedAddress);
        if (isMember) {
          Alert.alert('Already a Member', 'You are already a member of this group.');
          return;
        }
      }
    }

    // Confirm join
    const priceText = group.joinPrice === 0 ? 'free' : `${group.joinPrice} SOL`;
    Alert.alert(
      'Join Group',
      `Join "${group.name}" for ${priceText}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            setJoiningGroupId(group.id);
            try {
              const paymentService = new PaymentService();
              let paymentSignature = '';

              // If group requires payment, process payment first
              if (group.joinPrice > 0) {
                const platformFee = group.joinPrice * PLATFORM_JOIN_FEE_PERCENTAGE;
                const ownerAmount = group.joinPrice - platformFee;
                const paymentMessage = `You'll need to pay ${group.joinPrice} SOL to join this group.\n\nBreakdown:\n• Group owner: ${ownerAmount.toFixed(4)} SOL\n• Platform fee: ${platformFee.toFixed(4)} SOL (1%)\n\nYour wallet will open to confirm the payment.`;
                
                Alert.alert(
                  'Payment Required',
                  paymentMessage,
                  [
                    { text: 'Cancel', style: 'cancel', onPress: () => setJoiningGroupId(null) },
                    {
                      text: 'Pay & Join',
                      onPress: async () => {
                        try {
                          const paymentResult = await paymentService.payToJoinGroup(
                            group.paymentAddress,
                            group.joinPrice,
                            PLATFORM_PAYMENT_ADDRESS,
                            PLATFORM_JOIN_FEE_PERCENTAGE,
                            verifiedAddress // Pass already-connected wallet address
                          );
                          console.log('[Groups] Payment signatures:', paymentResult);

                          // Join the group with payment signature (transaction contains both payments)
                          await joinPublicGroup(group.id, paymentResult.ownerSignature);
                          
                          // Add to local groups if not already there
                          const existingGroup = groups.find(g => g.id === group.id || g.apiGroupId === group.id);
                          if (!existingGroup) {
                            const { uid, nowIso } = await import('../../utils/time');
                            const localGroup = {
                              id: uid(),
                              name: group.name,
                              ownerAddress: group.ownerAddress,
                              createdAt: nowIso(),
                              isPublic: true,
                              joinPrice: group.joinPrice,
                              paymentAddress: group.paymentAddress,
                              description: group.description,
                              apiGroupId: group.id,
                            };
                            const { dbApi } = await import('../../state/dbApi');
                            dbApi.addGroup(localGroup as any);
                            useAppStore.setState((s) => ({ groups: [localGroup, ...s.groups] }));
                          }
                          
                          Alert.alert('Success', 'You have joined the group!');
                          setIsMemberOfSelectedGroup(true); // Update membership state
                          await fetchPublicGroups(); // Refresh list
                        } catch (error: any) {
                          Alert.alert('Error', error.message || 'Failed to join group');
                        } finally {
                          setJoiningGroupId(null);
                        }
                      },
                    },
                  ]
                );
              } else {
                // Free group - still require wallet verification
                Alert.alert(
                  'Verify Wallet',
                  'Please verify with your Solana wallet to join this free group.',
                  [
                    { text: 'Cancel', style: 'cancel', onPress: () => setJoiningGroupId(null) },
                    {
                      text: 'Verify & Join',
                      onPress: async () => {
                        try {
                          // Verify wallet even for free groups
                          const walletService = new WalletService();
                          const walletAccount = await walletService.verifyOnce();
                          
                          if (!walletAccount || !walletAccount.address) {
                            Alert.alert('Error', 'Wallet verification failed. Please try again.');
                            setJoiningGroupId(null);
                            return;
                          }
                          
                          // Ensure the verified address matches
                          if (walletAccount.address !== verifiedAddress) {
                            // Update verified address if different wallet was used
                            await setVerified(walletAccount.address);
                          }
                          
                          // Join the free group
                          await joinPublicGroup(group.id, 'free');
                          
                          // Add to local groups if not already there
                          const existingGroup = groups.find(g => g.id === group.id || g.apiGroupId === group.id);
                          if (!existingGroup) {
                            const { uid, nowIso } = await import('../../utils/time');
                            const localGroup = {
                              id: uid(),
                              name: group.name,
                              ownerAddress: group.ownerAddress,
                              createdAt: nowIso(),
                              isPublic: true,
                              joinPrice: group.joinPrice,
                              paymentAddress: group.paymentAddress,
                              description: group.description,
                              apiGroupId: group.id,
                            };
                            const { dbApi } = await import('../../state/dbApi');
                            dbApi.addGroup(localGroup as any);
                            useAppStore.setState((s) => ({ groups: [localGroup, ...s.groups] }));
                          }
                          
                          Alert.alert('Success', 'You have joined the group!');
                          setIsMemberOfSelectedGroup(true); // Update membership state
                          await fetchPublicGroups(); // Refresh list
                        } catch (error: any) {
                          Alert.alert('Error', error.message || 'Failed to join group');
                        } finally {
                          setJoiningGroupId(null);
                        }
                      },
                    },
                  ]
                );
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to join group');
              setJoiningGroupId(null);
            }
          },
        },
      ]
    );
  };

  // Show verification UI if not verified
  if (!verifiedAddress) {
    return (
      <LinearGradient colors={[colors.background.gradient.start, colors.background.gradient.end]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[styles.content, { paddingTop: Math.max(insets.top, spacing.xl) + spacing.lg }]}>
          <Text style={styles.title}>Masterminds</Text>
        <View style={styles.verifyCard}>
          <Text style={styles.verifyTitle}>Verify your identity</Text>
          <Text style={styles.verifyText}>
            Verify once with your Solana wallet to enter Masterminds. This will open your wallet app to authenticate.
          </Text>
          <View style={{ alignItems: 'center', marginTop: spacing.md }}>
            <Pressable style={styles.primaryBtn} onPress={async () => {
              try {
                console.log('[Groups] Starting wallet verification - will open wallet picker...');
                const svc = new WalletService();
                // Use verifyOnce which opens the wallet picker/selector
                const acc = await svc.verifyOnce();
                console.log('[Groups] Wallet verification successful:', acc.address);
                if (acc && acc.address) {
                  await setVerified(acc.address);
                } else {
                  Alert.alert('Wallet verification', 'No address returned from wallet. Please try again.');
                }
              } catch (e: any) {
                console.error('[Groups] Wallet verification error:', e);
                const errorMsg = e?.message || 'Verification failed. Please try again.';
                // Provide more helpful error message
                const displayMsg = errorMsg.includes('cancel') || errorMsg.includes('reject') 
                  ? 'Connection was cancelled. Make sure to accept the connection in Phantom and wait for it to complete.'
                  : errorMsg;
                // Suppress alerts while returning from wallet or when user cancelled
                if (displayMsg.toLowerCase().includes('cancel') || displayMsg.toLowerCase().includes('interrupted')) {
                  return;
                }
                InteractionManager.runAfterInteractions(() => {
                  Alert.alert('Wallet verification', displayMsg);
                });
              }
            }}>
              <Text style={styles.primaryBtnText}>{useSiws ? 'Verify Seeker (SIWS)' : (seeker.isSeeker ? 'Verify with Solana Seeker' : 'Verify with Solana')}</Text>
            </Pressable>
          </View>
          {seeker.isSeeker && (
            <Text style={[styles.verifyText, { marginTop: spacing.xs, textAlign: 'center' }]}>
              Tip: When the Seeker wallet opens, complete the prompts and wait for the app to return automatically.
            </Text>
          )}
        </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background.gradient.start, colors.background.gradient.end]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={[styles.content, { paddingTop: Math.max(insets.top, spacing.xl) + spacing.lg }]}>
        {/* Header with title and profile button */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Masterminds</Text>
          <Pressable
            onPress={() => setShowEditModal(true)}
            style={styles.profileGradientBtn}
          >
            <LinearGradient
              colors={['#FF6B6B', '#C44569', '#8B3A5C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradientBtnInner}
            >
              <Ionicons name="person" size={20} color={colors.text.primary} />
            </LinearGradient>
          </Pressable>
        </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Discover Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discover</Text>
          <Text style={styles.sectionSubtitle}>
            Browse public Masterminds from around the world
          </Text>
          
          {/* Category Filters */}
          <View style={styles.categoryFilterContainer}>
            <Pressable
              style={[
                styles.categoryFilterButton,
                selectedCategory === null && styles.categoryFilterButtonActive
              ]}
              onPress={() => {
                setSelectedCategory(null);
                fetchPublicGroups();
              }}
            >
              <Text style={[
                styles.categoryFilterText,
                selectedCategory === null && styles.categoryFilterTextActive
              ]}>
                All
              </Text>
            </Pressable>
            {['Health', 'Financial', 'Personal Growth', 'Relationship'].map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.categoryFilterButton,
                  selectedCategory === cat && styles.categoryFilterButtonActive
                ]}
                onPress={async () => {
                  setSelectedCategory(cat);
                  await fetchPublicGroups(cat);
                }}
              >
                <Text style={[
                  styles.categoryFilterText,
                  selectedCategory === cat && styles.categoryFilterTextActive
                ]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
          
          {displayGroups.length > 0 ? (
            displayGroups.length > 3 ? (
              // Horizontal carousel for more than 3 groups
              <View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselContainer}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      tintColor={colors.text.primary}
                    />
                  }
                >
                  {displayGroups.map((item) => {
                    // Generate gradient colors based on the group name for visual variety
                    const colorIndex = item.name.charCodeAt(0) % 5;
                    const gradientColors = [
                      { start: '#7BA3D4', end: '#5B8BB4' }, // Blue
                      { start: '#8BC34A', end: '#6BA03A' }, // Green
                      { start: '#FF9800', end: '#DF7800' }, // Orange
                      { start: '#9C27B0', end: '#7C1790' }, // Purple
                      { start: '#E91E63', end: '#C90E43' }, // Pink
                    ];
                    const gradient = gradientColors[colorIndex];
                    // Safety check: ensure ownerAddress exists before using slice
                    const ownerAddr = item.ownerAddress || '';
                    const creatorName = item.ownerUsername || (ownerAddr ? `${ownerAddr.slice(0, 6)}...${ownerAddr.slice(-4)}` : 'Unknown');
                    const memberText = item.memberCount !== undefined 
                      ? `${item.memberCount} ${item.memberCount === 1 ? 'member' : 'members'}`
                      : 'New group';
                    
                    return (
                      <Pressable
                        key={item.id}
                        onPress={async () => {
                      // Fetch latest group data to ensure price updates are reflected
                      await fetchPublicGroups(selectedCategory || undefined);
                      const latestGroup = publicGroups.find(g => g.id === item.id) || item;
                      const groupToShow = { ...latestGroup, backgroundImage: latestGroup.backgroundImage || item.backgroundImage } as GroupForDisplay;
                      setSelectedGroup(groupToShow);
                      setShowGroupDetail(true);
                      
                      // Check if user is a member
                      if (verifiedAddress) {
                        setCheckingMembership(true);
                        try {
                          const isOwner = groupToShow.ownerAddress === verifiedAddress;
                          const isMember = isOwner || await apiService.checkMembership(groupToShow.id, verifiedAddress);
                          setIsMemberOfSelectedGroup(isMember);
                        } catch (error) {
                          console.error('[Groups] Error checking membership:', error);
                          setIsMemberOfSelectedGroup(false);
                        } finally {
                          setCheckingMembership(false);
                        }
                      } else {
                        setIsMemberOfSelectedGroup(false);
                      }
                    }}
                    style={[styles.discoverCardWrapper, styles.discoverCardCarousel]}
                  >
                    <View style={[styles.discoverCardContainer, styles.discoverCardContainerCarousel]}>
                      {/* Background Image */}
                      {item.backgroundImage ? (
                        <Image
                          source={{ uri: item.backgroundImage }}
                          style={styles.discoverCardBackground}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={[gradient.start, gradient.end]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.discoverCardBackground}
                        />
                      )}
                      {/* Gradient Glass Overlay */}
                      <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.discoverCardOverlay}
                      />
                      {/* Content */}
                      <View style={styles.discoverCardContent}>
                        <View style={styles.discoverCardHeader}>
                          <Text style={styles.discoverCardTitle}>{item.name}</Text>
                          {item.category && (
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{item.category}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.discoverCardMeta}>
                          <Text style={styles.discoverCardMetaText}>by {creatorName}</Text>
                          <Text style={styles.discoverCardMetaText}>•</Text>
                          <Text style={styles.discoverCardMetaText}>{memberText}</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                  );
                  })}
                </ScrollView>
              </View>
            ) : (
              // Vertical list for 3 or fewer groups
              <FlatList
                data={displayGroups}
                keyExtractor={(g) => g.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.text.primary}
                  />
                }
                renderItem={({ item }) => {
                  // Generate gradient colors based on the group name for visual variety
                  const colorIndex = item.name.charCodeAt(0) % 5;
                  const gradientColors = [
                    { start: '#7BA3D4', end: '#5B8BB4' }, // Blue
                    { start: '#8BC34A', end: '#6BA03A' }, // Green
                    { start: '#FF9800', end: '#DF7800' }, // Orange
                    { start: '#9C27B0', end: '#7C1790' }, // Purple
                    { start: '#E91E63', end: '#C90E43' }, // Pink
                  ];
                  const gradient = gradientColors[colorIndex];
                  // Safety check: ensure ownerAddress exists before using slice
                  const ownerAddr = item.ownerAddress || '';
                  const creatorName = item.ownerUsername || (ownerAddr ? `${ownerAddr.slice(0, 6)}...${ownerAddr.slice(-4)}` : 'Unknown');
                  const memberText = item.memberCount !== undefined 
                    ? `${item.memberCount} ${item.memberCount === 1 ? 'member' : 'members'}`
                    : 'New group';
                  
                  return (
                    <Pressable
                      onPress={async () => {
                        // Fetch latest group data to ensure price updates are reflected
                        await fetchPublicGroups(selectedCategory || undefined);
                        const latestGroup = publicGroups.find(g => g.id === item.id) || item;
                        const groupToShow = { ...latestGroup, backgroundImage: latestGroup.backgroundImage || item.backgroundImage } as GroupForDisplay;
                        setSelectedGroup(groupToShow);
                        setShowGroupDetail(true);
                        
                        // Check if user is a member - check local database first, then backend
                        if (verifiedAddress) {
                          setCheckingMembership(true);
                          try {
                            const isOwner = groupToShow.ownerAddress === verifiedAddress;
                            
                            // Check local database first for immediate response
                            let isMember = isOwner;
                            if (!isOwner) {
                              try {
                                const { dbApi } = await import('../../state/dbApi');
                                const localMember = await dbApi.getMember(groupToShow.id, verifiedAddress);
                                isMember = !!localMember;
                              } catch (error) {
                                console.error('[Groups] Error checking local membership:', error);
                                isMember = false;
                              }
                            }
                            
                            // Also check backend to ensure consistency
                            if (!isOwner) {
                              try {
                                const backendIsMember = await apiService.checkMembership(groupToShow.id, verifiedAddress);
                                // Use backend result if local check failed or if backend says not a member
                                if (!isMember || !backendIsMember) {
                                  isMember = backendIsMember;
                                }
                              } catch (error) {
                                console.error('[Groups] Error checking backend membership:', error);
                                // Keep local membership state if backend check fails
                              }
                            }
                            
                            setIsMemberOfSelectedGroup(isMember);
                          } catch (error) {
                            console.error('[Groups] Error checking membership:', error);
                            setIsMemberOfSelectedGroup(false);
                          } finally {
                            setCheckingMembership(false);
                          }
                        } else {
                          setIsMemberOfSelectedGroup(false);
                        }
                      }}
                      style={styles.discoverCardWrapper}
                    >
                      <View style={styles.discoverCardContainer}>
                        {/* Background Image */}
                        {item.backgroundImage ? (
                          <Image
                            source={{ uri: item.backgroundImage }}
                            style={styles.discoverCardBackground}
                            resizeMode="cover"
                          />
                        ) : (
                          <LinearGradient
                            colors={[gradient.start, gradient.end]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.discoverCardBackground}
                          />
                        )}
                        {/* Gradient Glass Overlay */}
                        <LinearGradient
                          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.discoverCardOverlay}
                        />
                        {/* Content */}
                        <View style={styles.discoverCardContent}>
                          <View style={styles.discoverCardHeader}>
                            <Text style={styles.discoverCardTitle}>{item.name}</Text>
                            {item.category && (
                              <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>{item.category}</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.discoverCardMeta}>
                            <Text style={styles.discoverCardMetaText}>by {creatorName}</Text>
                            <Text style={styles.discoverCardMetaText}>•</Text>
                            <Text style={styles.discoverCardMetaText}>{memberText}</Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                }}
              />
            )
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No public groups available yet.</Text>
              <Text style={styles.emptySubtext}>Be the first to create one!</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Group Detail Modal */}
      <Modal
        visible={showGroupDetail}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowGroupDetail(false);
          setSelectedGroup(null);
          setIsMemberOfSelectedGroup(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedGroup ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Background Image at Top */}
                {selectedGroup.backgroundImage && (
                  <View style={styles.modalImageContainer}>
                    <Image
                      source={{ uri: selectedGroup.backgroundImage }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.3)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.modalImageOverlay}
                    />
                  </View>
                )}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedGroup.name}</Text>
                    {selectedGroup.category && (
                      <View style={[styles.categoryBadge, { marginTop: spacing.xs, alignSelf: 'flex-start' }]}>
                        <Text style={styles.categoryBadgeText}>{selectedGroup.category}</Text>
                      </View>
                    )}
                  </View>
                  <Pressable
                    style={styles.modalCloseBtn}
                    onPress={() => {
                      setShowGroupDetail(false);
                      setSelectedGroup(null);
                    }}
                  >
                    <Ionicons name="close" size={20} color={colors.text.primary} />
                  </Pressable>
                </View>
                
                <Text style={styles.modalSubtitle}>Mastermind Details</Text>

                {/* Creator Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.label}>Created by</Text>
                  <View style={styles.detailValueContainer}>
                    <Text style={styles.detailValue}>
                      {selectedGroup.ownerUsername || (selectedGroup.ownerAddress ? `${selectedGroup.ownerAddress.slice(0, 6)}...${selectedGroup.ownerAddress.slice(-4)}` : 'Unknown')}
                    </Text>
                  </View>
                </View>

                {/* Member Count */}
                {selectedGroup.memberCount !== undefined && selectedGroup.memberCount !== null && (
                  <View style={styles.detailSection}>
                    <Text style={styles.label}>Members</Text>
                    <View style={styles.detailValueContainer}>
                      <Text style={styles.detailValue}>
                        {selectedGroup.memberCount} {selectedGroup.memberCount === 1 ? 'member' : 'members'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Description */}
                {selectedGroup.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.label}>Description</Text>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailText}>{selectedGroup.description}</Text>
                    </View>
                  </View>
                )}

                {/* Open Chat Button - Show if user is owner or member */}
                {isMemberOfSelectedGroup && (
                  <View style={styles.modalButtons}>
                    <Pressable
                      style={{ 
                        width: '100%',
                        backgroundColor: colors.success.main + '50',
                        borderColor: colors.success.main,
                        borderWidth: 2,
                        borderRadius: borderRadius.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                        gap: spacing.xs
                      }}
                      onPress={() => {
                        // Find the local group ID (could be apiGroupId or local id)
                        const localGroup = groups.find(g => g.id === selectedGroup.id || g.apiGroupId === selectedGroup.id);
                        const groupIdForChat = localGroup?.id || selectedGroup.id;
                        
                        setShowGroupDetail(false);
                        setSelectedGroup(null);
                        router.push(`/masterminds/${groupIdForChat}`);
                      }}
                    >
                      <Ionicons name="chatbubbles" size={20} color={colors.success.main} />
                      <Text style={{ 
                        color: colors.success.main, 
                        fontWeight: typography.weights.bold,
                        fontSize: typography.sizes.md
                      }}>Open Chat</Text>
                    </Pressable>
                    
                    {/* Leave Group Button - Only show for non-owners who are members */}
                    {selectedGroup.ownerAddress !== verifiedAddress && (
                      <Pressable
                        style={{ 
                          width: '100%',
                          backgroundColor: colors.error.main + '30',
                          borderColor: colors.error.main,
                          borderWidth: 2,
                          borderRadius: borderRadius.sm,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: spacing.lg,
                          paddingVertical: spacing.md,
                          gap: spacing.xs,
                          marginTop: spacing.sm
                        }}
                        onPress={() => {
                          setLeavingGroupId(selectedGroup.id);
                        }}
                        disabled={verifyingLeave}
                      >
                        <Ionicons name="exit-outline" size={20} color={colors.error.main} />
                        <Text style={{ 
                          color: colors.error.main, 
                          fontWeight: typography.weights.bold,
                          fontSize: typography.sizes.md
                        }}>Leave Group</Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Action Button - Only show if user is not a member and not the owner */}
                {!isMemberOfSelectedGroup && selectedGroup.ownerAddress !== verifiedAddress && (
                  <View style={styles.modalButtons}>
                    <Pressable
                      style={[styles.modalBtn, styles.modalBtnPrimary, { width: '100%' }, joiningGroupId === selectedGroup.id && styles.modalBtnDisabled]}
                      onPress={() => handleJoinPublicGroup(selectedGroup)}
                      disabled={joiningGroupId === selectedGroup.id}
                    >
                      {joiningGroupId === selectedGroup.id ? (
                        <ActivityIndicator color={colors.text.primary} size="small" />
                      ) : (
                        <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>
                          {(!selectedGroup.joinPrice || selectedGroup.joinPrice === 0) ? 'Join for Free' : `Join for ${selectedGroup.joinPrice} SOL`}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )}
                {/* Owner Message - Only show if user is owner but not yet a member (shouldn't happen, but just in case) */}
                {selectedGroup.ownerAddress === verifiedAddress && !isMemberOfSelectedGroup && (
                  <View style={styles.modalButtons}>
                    <View style={[styles.modalBtn, styles.ownerBadge]}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success.main} style={{ marginRight: spacing.sm }} />
                      <Text style={[styles.modalBtnText, styles.ownerBadgeText]}>
                        You are the owner of this group
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={{ padding: spacing.lg }}>
                <Text style={{ color: colors.text.primary }}>No group selected</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Leave Group Confirmation Modal */}
      <Modal
        visible={leavingGroupId !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!verifyingLeave) {
            setLeavingGroupId(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                <Ionicons name="exit-outline" size={24} color={colors.error.main} />
                <Text style={styles.modalTitle}>Leave Group</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => {
                  if (!verifyingLeave) {
                    setLeavingGroupId(null);
                  }
                }}
                disabled={verifyingLeave}
              >
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Are you sure you want to leave this group?
            </Text>

            <View style={styles.detailSection}>
              <View style={{ backgroundColor: '#FF9800' + '20', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                  <Ionicons name="warning" size={20} color="#FF9800" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.hint, { color: '#FF9800', fontWeight: '600' }]}>
                      Important Notice
                    </Text>
                    <Text style={[styles.hint, { marginTop: spacing.xs }]}>
                      If this group changes from free to paid, you will be charged the current join price when you rejoin in the future.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  if (!verifyingLeave) {
                    setLeavingGroupId(null);
                  }
                }}
                disabled={verifyingLeave}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnDanger]}
                onPress={async () => {
                  if (!leavingGroupId || !verifiedAddress) {
                    Alert.alert('Error', 'Missing group or wallet information');
                    return;
                  }

                  setVerifyingLeave(true);
                  try {
                    // Verify wallet ownership
                    const walletService = new WalletService();
                    const walletAccount = await walletService.verifyOnce();
                    
                    if (!walletAccount || !walletAccount.address) {
                      Alert.alert('Error', 'Wallet verification failed. Please try again.');
                      setVerifyingLeave(false);
                      return;
                    }

                    // Verify the address matches
                    if (walletAccount.address !== verifiedAddress) {
                      Alert.alert('Error', 'Wallet address mismatch. Please use the wallet you used to join this group.');
                      setVerifyingLeave(false);
                      return;
                    }

                    // Find the group to get its ID
                    const groupToLeave = publicGroups.find(g => g.id === leavingGroupId) || 
                                        groups.find(g => g.id === leavingGroupId || g.apiGroupId === leavingGroupId);
                    
                    if (!groupToLeave) {
                      Alert.alert('Error', 'Group not found');
                      setVerifyingLeave(false);
                      return;
                    }

                    // Remove membership from local database
                    const { dbApi } = await import('../../state/dbApi');
                    const { run } = await import('../../db/client');
                    await run('DELETE FROM mastermind_members WHERE groupId=? AND userAddress=?', [leavingGroupId, verifiedAddress]);

                    // Remove from local groups if user is not the owner
                    // (Owners should keep the group in their list even if they're not "members")
                    const localGroup = groups.find(g => g.id === leavingGroupId || g.apiGroupId === leavingGroupId);
                    const isOwner = localGroup?.ownerAddress === verifiedAddress;
                    
                    if (localGroup && !isOwner) {
                      // Remove from local groups since user is no longer a member
                      useAppStore.setState((s) => ({
                        groups: s.groups.filter(g => {
                          const groupIdMatch = g.id === leavingGroupId || g.apiGroupId === leavingGroupId;
                          return !groupIdMatch;
                        })
                      }));
                    }

                    // Update membership state
                    setIsMemberOfSelectedGroup(false);
                    
                    // Close modals
                    setShowGroupDetail(false);
                    setSelectedGroup(null);
                    setLeavingGroupId(null);

                    // Refresh groups list to ensure UI is updated
                    await fetchPublicGroups();

                    Alert.alert('Success', 'You have left the group.');
                  } catch (error: any) {
                    console.error('[Groups] Error leaving group:', error);
                    const errorMsg = error?.message || 'Failed to leave group. Please try again.';
                    if (!errorMsg.toLowerCase().includes('cancel')) {
                      Alert.alert('Error', errorMsg);
                    }
                  } finally {
                    setVerifyingLeave(false);
                  }
                }}
                disabled={verifyingLeave}
              >
                {verifyingLeave ? (
                  <>
                    <ActivityIndicator size="small" color={colors.text.primary} style={{ marginRight: spacing.sm }} />
                    <Text style={[styles.modalBtnText, styles.modalBtnDangerText]}>Verifying...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="exit-outline" size={20} color={colors.error.main} style={{ marginRight: spacing.sm }} />
                    <Text style={[styles.modalBtnText, styles.modalBtnDangerText]}>Leave Group</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!verifyingDelete) {
            setShowDeleteConfirm(false);
            setDeletingGroupId(null);
            setDeletingGroupName('');
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                <Ionicons name="warning" size={24} color={colors.error.main} />
                <Text style={styles.modalTitle}>Delete Group</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => {
                  if (!verifyingDelete) {
                    setShowDeleteConfirm(false);
                    setDeletingGroupId(null);
                    setDeletingGroupName('');
                  }
                }}
                disabled={verifyingDelete}
              >
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Are you sure you want to delete "{deletingGroupName}"?
            </Text>

            <View style={styles.detailSection}>
              <Text style={styles.detailText}>
                This action cannot be undone. The group, all messages, and member data will be permanently deleted.
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.label}>Verification Required</Text>
              <Text style={styles.hint}>
                You'll need to verify with your wallet to confirm deletion. This ensures only the group owner can delete it.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  if (!verifyingDelete) {
                    setShowDeleteConfirm(false);
                    setDeletingGroupId(null);
                    setDeletingGroupName('');
                  }
                }}
                disabled={verifyingDelete}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnDanger, verifyingDelete && styles.modalBtnDisabled]}
                onPress={async () => {
                  if (!deletingGroupId || !verifiedAddress) {
                    Alert.alert('Error', 'Wallet not verified. Please verify your wallet first.');
                    return;
                  }

                  setVerifyingDelete(true);
                  try {
                    // Verify wallet ownership - this will prompt the wallet
                    const walletService = new WalletService();
                    const walletAccount = await walletService.verifyOnce();
                    
                    // Convert address to base58 format for consistency
                    const verifiedAddr = walletAccount.address;
                    
                    // Check if the verified address matches the connected wallet
                    if (verifiedAddr !== verifiedAddress) {
                      Alert.alert('Error', 'Wallet address mismatch. Please use the wallet that created this group.');
                      setVerifyingDelete(false);
                      return;
                    }

                    // Use the wallet address as verification signature
                    // The backend will verify that this address matches the group owner
                    const verificationSignature = verifiedAddr;
                    
                    // Find the correct group ID (could be apiGroupId or local id)
                    // Check if this is a public group with a backend ID
                    const groupToDelete = publicGroups.find(g => 
                      g.id === deletingGroupId || 
                      (g as any).apiGroupId === deletingGroupId ||
                      g.id === (groups.find(lg => lg.id === deletingGroupId)?.apiGroupId)
                    );
                    
                    // Use the backend ID if available, otherwise use the local ID
                    const backendGroupId = groupToDelete?.id || 
                                         (groups.find(g => g.id === deletingGroupId)?.apiGroupId) || 
                                         deletingGroupId;
                    
                    console.log('[Groups] Deleting group:', {
                      deletingGroupId,
                      backendGroupId,
                      groupToDelete: groupToDelete?.name,
                      groupToDeleteId: groupToDelete?.id,
                      verifiedAddr,
                      allPublicGroups: publicGroups.map(g => ({ id: g.id, name: g.name }))
                    });
                    
                    // Delete the group
                    await deletePublicGroup(backendGroupId, verificationSignature);
                    
                    // Force refresh groups list from backend to ensure deleted groups are removed
                    // This is important because the backend has the source of truth
                    if (selectedCategory) {
                      await fetchPublicGroups(selectedCategory);
                    } else {
                      await fetchPublicGroups();
                    }
                    
                    // Also refresh all groups to ensure consistency across categories
                    await fetchPublicGroups();
                    
                    Alert.alert('Success', 'Group deleted successfully');
                    setShowDeleteConfirm(false);
                    setDeletingGroupId(null);
                    setDeletingGroupName('');
                  } catch (error: any) {
                    console.error('[Groups] Error deleting group:', error);
                    Alert.alert('Error', error.message || 'Failed to delete group. Please try again.');
                  } finally {
                    setVerifyingDelete(false);
                  }
                }}
                disabled={verifyingDelete}
              >
                {verifyingDelete ? (
                  <>
                    <ActivityIndicator size="small" color={colors.text.primary} style={{ marginRight: spacing.sm }} />
                    <Text style={[styles.modalBtnText, styles.modalBtnDangerText]}>Verifying...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="trash" size={20} color={colors.text.primary} style={{ marginRight: spacing.sm }} />
                    <Text style={[styles.modalBtnText, styles.modalBtnDangerText]}>Delete Group</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Group Modal - Combined: Price, Image, Delete */}
      <Modal
        visible={showEditGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditGroupModal(false);
          setEditingGroupId(null);
          setEditingGroupImage(null);
          setEditingGroupPrice('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                  <Ionicons name="create-outline" size={24} color={colors.primary.main} />
                  <Text style={styles.modalTitle}>Edit Group</Text>
                </View>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => {
                    setShowEditGroupModal(false);
                    setEditingGroupId(null);
                    setEditingGroupImage(null);
                    setEditingGroupPrice('');
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.text.primary} />
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>
                Update your group's settings
              </Text>

              {/* Update Join Price */}
              <View style={styles.detailSection}>
                <Text style={styles.label}>Join Price (SOL)</Text>
                <Text style={styles.hint}>
                  Set the price users need to pay to join this group. Set to 0 for free groups.
                </Text>
                <TextInput
                  value={editingGroupPrice}
                  onChangeText={setEditingGroupPrice}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.modalInputField}
                  keyboardType="decimal-pad"
                  autoFocus={false}
                  selectionColor={colors.primary.main}
                />
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnPrimary, { marginTop: spacing.sm }]}
                  onPress={async () => {
                    if (!editingGroupId) return;
                    
                    const price = parseFloat(editingGroupPrice);
                    if (isNaN(price) || price < 0) {
                      Alert.alert('Error', 'Please enter a valid join price (0 or greater)');
                      return;
                    }

                    try {
                      await updateGroupJoinPrice(editingGroupId, price);
                      Alert.alert('Success', 'Join price updated successfully');
                      // Refresh groups to show updated price
                      await fetchPublicGroups();
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to update join price');
                    }
                  }}
                >
                  <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>Update Price</Text>
                </Pressable>
              </View>

              {/* Background Image */}
              <View style={styles.detailSection}>
                <Text style={styles.label}>Background Image</Text>
                <Text style={styles.hint}>
                  Update the background image for your group card
                </Text>
                <View style={styles.imagePickerContainer}>
                  {editingGroupImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: editingGroupImage }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <Pressable
                        style={styles.removeImageBtn}
                        onPress={() => setEditingGroupImage(null)}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.error.main} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable 
                      style={[styles.imagePickerBtn, uploadingImage && styles.imagePickerBtnDisabled]} 
                      onPress={() => pickBackgroundImage(true)}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <ActivityIndicator size="small" color={colors.primary.main} />
                          <Text style={styles.imagePickerText}>Uploading...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="image-outline" size={24} color={colors.primary.main} />
                          <Text style={styles.imagePickerText}>Choose Background Image</Text>
                          <Text style={styles.imagePickerHint}>16:9 aspect ratio recommended</Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>
                {editingGroupImage && (
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnPrimary, { marginTop: spacing.sm }]}
                    onPress={async () => {
                      if (!editingGroupId || !verifiedAddress) return;
                      
                      try {
                        // Optimistic update: Update local state immediately so image shows right away
                        // Find the local group to get its apiGroupId
                        const localGroup = groups.find(g => g.id === editingGroupId);
                        const apiGroupId = localGroup?.apiGroupId || editingGroupId;

                        const currentGroups = publicGroups;
                        const updatedGroups = currentGroups.map(g => {
                          // Match by backend id or apiGroupId
                          if (g.id === apiGroupId || g.id === editingGroupId || (g as any).apiGroupId === editingGroupId) {
                            return { ...g, backgroundImage: editingGroupImage || undefined };
                          }
                          return g;
                        });

                        // Also update local groups for immediate display
                        const updatedLocalGroups = groups.map(g =>
                          g.id === editingGroupId 
                            ? { ...g, backgroundImage: editingGroupImage || undefined } as any
                            : g
                        );

                        // Update both stores immediately
                        useAppStore.setState({ 
                          publicGroups: updatedGroups,
                          groups: updatedLocalGroups
                        });

                        // Then sync to backend (don't wait for it to show the image)
                        // Use apiGroupId for backend call, fallback to editingGroupId if not found
                        const backendGroupId = apiGroupId || editingGroupId;
                        apiService.updateGroupBackgroundImage(
                          backendGroupId,
                          verifiedAddress,
                          editingGroupImage || null
                        ).then(() => {
                          // Refresh from backend to get latest data
                          fetchPublicGroups();
                        }).catch((error: any) => {
                          console.error('[Groups] Background sync error (non-blocking):', error);
                          // Revert optimistic update on error
                          fetchPublicGroups();
                        });
                        
                        Alert.alert('Success', 'Group image updated successfully');
                      } catch (error: any) {
                        Alert.alert('Error', error.message || 'Failed to update image');
                      }
                    }}
                  >
                    <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>Save Image</Text>
                  </Pressable>
                )}
              </View>

              {/* Delete Group */}
              <View style={styles.detailSection}>
                <Text style={styles.label}>Delete Group</Text>
                <Text style={styles.hint}>
                  Permanently delete this group. This action cannot be undone.
                </Text>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnDanger, { marginTop: spacing.sm }]}
                  onPress={() => {
                    if (!editingGroupId) return;
                    
                    // Find the group name and backend ID for the confirmation modal
                    const localGroup = groups.find(g => g.id === editingGroupId);
                    const localApiGroupId = (localGroup as any)?.apiGroupId;
                    const groupToDelete = publicGroups.find(g => 
                      g.id === localApiGroupId || 
                      g.id === editingGroupId || 
                      (g as any).apiGroupId === editingGroupId
                    );
                    
                    const backendId = localApiGroupId || groupToDelete?.id || editingGroupId;
                    const finalGroupName = groupToDelete?.name || localGroup?.name || 'this group';
                    
                    setShowEditGroupModal(false);
                    setDeletingGroupId(backendId);
                    setDeletingGroupName(finalGroupName);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <Ionicons name="trash" size={20} color={colors.error.main} style={{ marginRight: spacing.sm }} />
                  <Text style={[styles.modalBtnText, styles.modalBtnDangerText]}>Delete Group</Text>
                </Pressable>
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => {
                    setShowEditGroupModal(false);
                    setEditingGroupId(null);
                    setEditingGroupImage(null);
                    setEditingGroupPrice('');
                  }}
                >
                  <Text style={styles.cancelBtnText}>Close</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Update Join Price Modal */}
      <Modal
        visible={editingJoinPriceGroupId !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEditingJoinPriceGroupId(null);
          setNewJoinPrice('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                <Ionicons name="cash-outline" size={24} color={colors.primary.main} />
                <Text style={styles.modalTitle}>Update Join Price</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => {
                  setEditingJoinPriceGroupId(null);
                  setNewJoinPrice('');
                }}
              >
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Members who joined when it was free will remain free. New members will pay the updated price. If someone leaves and rejoins, they'll need to pay the current price.
            </Text>

            <View style={styles.detailSection}>
              <Text style={styles.label}>New Join Price (SOL) *</Text>
              <TextInput
                value={newJoinPrice}
                onChangeText={setNewJoinPrice}
                placeholder="0 for free groups"
                placeholderTextColor={colors.text.tertiary}
                style={styles.modalInputField}
                keyboardType="decimal-pad"
                autoFocus
                selectionColor={colors.primary.main}
              />
              <Text style={styles.hint}>Set to 0 to make the group free</Text>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setEditingJoinPriceGroupId(null);
                  setNewJoinPrice('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={async () => {
                  if (!editingJoinPriceGroupId) return;
                  
                  const price = parseFloat(newJoinPrice);
                  if (isNaN(price) || price < 0) {
                    Alert.alert('Error', 'Please enter a valid join price (0 or greater)');
                    return;
                  }

                  try {
                    await updateGroupJoinPrice(editingJoinPriceGroupId, price);
                    Alert.alert('Success', 'Join price updated successfully');
                    setEditingJoinPriceGroupId(null);
                    setNewJoinPrice('');
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to update join price');
                  }
                }}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>Update Price</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Public Group Creation Modal */}
      <Modal
        visible={showPublicModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPublicModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Create Public Mastermind</Text>
              <Text style={styles.modalSubtitle}>
                Public groups are discoverable by everyone. You'll pay {PLATFORM_CREATE_FEE} SOL to create.
              </Text>

              <Text style={styles.label}>Group Name *</Text>
              <TextInput
                value={publicGroupName}
                onChangeText={setPublicGroupName}
                placeholder="Enter group name"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                value={publicGroupDescription}
                onChangeText={setPublicGroupDescription}
                placeholder="What is this group about?"
                placeholderTextColor={colors.text.tertiary}
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                multiline
              />

              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryContainer}>
                {['Health', 'Financial', 'Personal Growth', 'Relationship'].map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryButton,
                      publicGroupCategory === cat && styles.categoryButtonSelected
                    ]}
                    onPress={() => setPublicGroupCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      publicGroupCategory === cat && styles.categoryButtonTextSelected
                    ]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.hint}>Select a category for your group</Text>

              <Text style={styles.label}>Background Image (Optional)</Text>
              <View style={styles.imagePickerContainer}>
                {publicGroupBackgroundImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: publicGroupBackgroundImage }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <Pressable
                      style={styles.removeImageBtn}
                      onPress={() => setPublicGroupBackgroundImage(null)}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error.main} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable 
                    style={[styles.imagePickerBtn, uploadingImage && styles.imagePickerBtnDisabled]} 
                    onPress={() => pickBackgroundImage(false)}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <ActivityIndicator size="small" color={colors.primary.main} />
                        <Text style={styles.imagePickerText}>Uploading...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="image-outline" size={24} color={colors.primary.main} />
                        <Text style={styles.imagePickerText}>Choose Background Image</Text>
                        <Text style={styles.imagePickerHint}>16:9 aspect ratio recommended</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>

              <Text style={styles.label}>Join Price (SOL) *</Text>
              <TextInput
                value={publicGroupJoinPrice}
                onChangeText={setPublicGroupJoinPrice}
                placeholder="0 for free groups"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
                keyboardType="decimal-pad"
              />
              <Text style={styles.hint}>Set to 0 for free-to-join groups</Text>

              <Text style={styles.label}>Payment Address (for join fees) *</Text>
              <TextInput
                value={publicGroupPaymentAddress}
                onChangeText={setPublicGroupPaymentAddress}
                placeholder="Your SOL address to receive payments"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
              />
              <Text style={styles.hint}>Required: Address where you'll receive join payments</Text>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => {
                    setShowPublicModal(false);
                    setPublicGroupName('');
                    setPublicGroupDescription('');
                    setPublicGroupJoinPrice('0');
                    setPublicGroupCategory('');
                    setPublicGroupBackgroundImage(null);
                    setPublicGroupPaymentAddress(DEFAULT_JOIN_PAYMENT_ADDRESS);
                  }}
                  disabled={isCreatingPublic}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, styles.primaryBtn]}
                  onPress={async () => {
                    if (!publicGroupName.trim()) {
                      Alert.alert('Error', 'Please enter a group name');
                      return;
                    }
                    const joinPrice = parseFloat(publicGroupJoinPrice);
                    if (isNaN(joinPrice) || joinPrice < 0) {
                      Alert.alert('Error', 'Please enter a valid join price (0 or greater)');
                      return;
                    }
                    if (!PLATFORM_PAYMENT_ADDRESS) {
                      Alert.alert('Error', 'Platform payment address not configured');
                      return;
                    }
                    if (!publicGroupPaymentAddress.trim()) {
                      Alert.alert('Error', 'Payment address is required');
                      return;
                    }
                    if (!publicGroupCategory) {
                      Alert.alert('Error', 'Please select a category');
                      return;
                    }

                    setIsCreatingPublic(true);
                    try {
                      const createMessage = 'Public group created! You can find it in the Discover tab.';
                      
                      await createPublicGroup(
                        publicGroupName.trim(),
                        joinPrice,
                        publicGroupPaymentAddress.trim(),
                        publicGroupCategory,
                        publicGroupDescription.trim() || undefined,
                        PLATFORM_CREATE_FEE,
                        publicGroupBackgroundImage || undefined
                      );
                      Alert.alert('Success', createMessage);
                      setShowPublicModal(false);
                      setPublicGroupName('');
                      setPublicGroupDescription('');
                      setPublicGroupJoinPrice('0');
                      setPublicGroupCategory('');
                      setPublicGroupBackgroundImage(null);
                      setPublicGroupPaymentAddress(DEFAULT_JOIN_PAYMENT_ADDRESS);
                      
                      // Refresh groups with current category filter if active
                      // This ensures the newly created group appears in the filtered view
                      if (selectedCategory) {
                        await fetchPublicGroups(selectedCategory);
                      } else {
                        await fetchPublicGroups();
                      }
                      
                      // Also refresh all groups in the background to ensure we have the latest data
                      // This helps if the category filter is changed later
                      fetchPublicGroups().catch(() => {
                        // Ignore errors
                      });
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to create public group');
                    } finally {
                      setIsCreatingPublic(false);
                    }
                  }}
                  disabled={isCreatingPublic}
                >
                  {isCreatingPublic ? (
                    <ActivityIndicator color={colors.text.primary} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Create & Pay {PLATFORM_CREATE_FEE} SOL</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
          </View>
        </Modal>

      {/* Set Username Modal */}
      <Modal
        visible={editingUsername}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEditingUsername(false);
          setTempUsername(username || '');
          setUsernameError(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                <Ionicons name="person-outline" size={24} color={colors.primary.main} />
                <Text style={styles.modalTitle}>Set Username</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => {
                  setEditingUsername(false);
                  setTempUsername(username || '');
                  setUsernameError(null);
                }}
              >
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Choose a unique username for your wallet. This cannot be changed once set.
            </Text>

            <View style={styles.detailSection}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                value={tempUsername}
                onChangeText={(text) => {
                  setTempUsername(text);
                  setUsernameError(null);
                }}
                placeholder="Enter username (3-20 chars)"
                placeholderTextColor={colors.text.tertiary}
                style={[
                  styles.modalInputField,
                  usernameError && styles.inputError
                ]}
                autoFocus
                editable={!checkingUsername}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={colors.primary.main}
              />
              <Text style={styles.hint}>
                Username can only contain letters, numbers, and underscores
              </Text>
              {usernameError && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.error.main} />
                  <Text style={styles.errorText}>{usernameError}</Text>
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setEditingUsername(false);
                  setTempUsername(username || '');
                  setUsernameError(null);
                }}
                disabled={checkingUsername}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary, checkingUsername && styles.modalBtnDisabled]}
                onPress={async () => {
                  if (!tempUsername.trim()) {
                    setUsernameError('Username cannot be empty');
                    return;
                  }
                  setCheckingUsername(true);
                  setUsernameError(null);
                  try {
                    await setUsername(tempUsername.trim());
                    setEditingUsername(false);
                    setTempUsername('');
                    Alert.alert('Success', 'Username set successfully!');
                  } catch (error: any) {
                    setUsernameError(error.message || 'Failed to set username');
                  } finally {
                    setCheckingUsername(false);
                  }
                }}
                disabled={checkingUsername}
              >
                {checkingUsername ? (
                  <ActivityIndicator size="small" color={colors.text.primary} />
                ) : (
                  <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>Set Username</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                  <Ionicons name="person-outline" size={24} color={colors.primary.main} />
                  <Text style={styles.modalTitle}>Your Profile</Text>
                </View>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setShowEditModal(false)}
                >
                  <Ionicons name="close" size={20} color={colors.text.primary} />
                </Pressable>
              </View>

              {/* Profile Display Section */}
              <View style={styles.detailSection}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.profileDisplayRow}>
                  <Text style={styles.profileDisplayValue}>
                    {username || 'No username set'}
                  </Text>
                  {verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success.main} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                {xHandle && (
                  <Text style={styles.hint}>@{xHandle}</Text>
                )}
              </View>

              {/* Wallet Address */}
              {verifiedAddress && (
                <View style={styles.detailSection}>
                  <Text style={styles.label}>Wallet Address</Text>
                  <Text style={styles.hint}>
                    {verifiedAddress.slice(0, 8)}...{verifiedAddress.slice(-8)}
                  </Text>
                </View>
              )}

              {/* Set Username Section */}
              {!usernameSet && (
                <View style={styles.detailSection}>
                  <Text style={styles.label}>Set Username</Text>
                  <Text style={styles.hint}>
                    Choose a unique username for your wallet. This cannot be changed once set.
                  </Text>
                  <Pressable
                    style={styles.setUsernameBtn}
                    onPress={() => {
                      setTempUsername('');
                      setEditingUsername(true);
                      setUsernameError(null);
                      setShowEditModal(false);
                    }}
                  >
                    <Ionicons name="person-add-outline" size={16} color={colors.primary.main} />
                    <Text style={styles.setUsernameBtnText}>Set Username</Text>
                  </Pressable>
                </View>
              )}

              {/* Create Mastermind Section */}
              <View style={styles.detailSection}>
                <Text style={styles.label}>Create Mastermind</Text>
                <Pressable 
                  style={styles.primaryBtn} 
                  onPress={() => {
                    setShowEditModal(false);
                    setShowPublicModal(true);
                  }}
                >
                  <Text style={styles.primaryBtnText}>Create Public Group</Text>
                </Pressable>
                <Text style={styles.hint}>
                  Public groups require a {PLATFORM_CREATE_FEE} SOL creation fee
                </Text>
              </View>

              {/* My Masterminds Section */}
              <View style={styles.detailSection}>
                <Text style={styles.label}>My Masterminds</Text>
                {(() => {
                  // Use the state that's updated via useEffect
                  const myPublicGroups = myMastermindsGroups;
                  
                  return myPublicGroups.length > 0 ? (
                    <View style={{ marginTop: spacing.sm }}>
                      {myPublicGroups.map((item) => {
                        // Show username if owner is the current user, otherwise show wallet address
                        const isOwner = item.ownerAddress === verifiedAddress;
                        const ownerDisplay = isOwner && username 
                          ? username 
                          : item.ownerAddress 
                            ? `${item.ownerAddress.slice(0,4)}…${item.ownerAddress.slice(-4)}`
                            : 'You';
                        // Get background image from publicGroups if available
                        // Match by apiGroupId (backend ID) or local id
                        const publicGroup = publicGroups.find(g => 
                          g.id === (item as any).apiGroupId || 
                          g.id === item.id || 
                          (g as any).apiGroupId === item.id
                        );
                        const backgroundImage = publicGroup?.backgroundImage || (item as any).backgroundImage;
                        
                        return (
                          <View key={item.id} style={[styles.myMastermindCardWrapper, { marginBottom: spacing.sm }]}>
                            <View style={styles.myMastermindCardContainer}>
                              {/* Background Image */}
                              {backgroundImage ? (
                                <Image
                                  source={{ uri: backgroundImage }}
                                  style={styles.myMastermindCardBackground}
                                  resizeMode="cover"
                                />
                              ) : (
                                <LinearGradient
                                  colors={['rgba(123, 163, 212, 0.3)', 'rgba(91, 139, 180, 0.5)']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 1 }}
                                  style={styles.myMastermindCardBackground}
                                />
                              )}
                              {/* Gradient Glass Overlay */}
                              <LinearGradient
                                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.myMastermindCardOverlay}
                              />
                              {/* Content */}
                              <View style={styles.myMastermindCardContent}>
                                <View style={styles.myMastermindCardHeader}>
                                  <Text style={styles.myMastermindCardTitle}>{item.name}</Text>
                                  <View style={styles.publicBadge}>
                                    <Text style={styles.publicBadgeText}>Public</Text>
                                  </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs, flexWrap: 'wrap' }}>
                                  <Text style={styles.myMastermindCardSub}>Owner: {ownerDisplay}</Text>
                                  {(publicGroup?.category || (item as any).category) && (
                                    <>
                                      <Text style={styles.myMastermindCardSub}>•</Text>
                                      <View style={styles.categoryBadgeSmall}>
                                        <Text style={styles.categoryBadgeTextSmall}>
                                          {publicGroup?.category || (item as any).category}
                                        </Text>
                                      </View>
                                    </>
                                  )}
                                </View>
                                {item.description && (
                                  <Text style={styles.myMastermindCardDescription} numberOfLines={2}>
                                    {item.description}
                                  </Text>
                                )}
                                {item.joinPrice !== undefined && item.joinPrice > 0 && (
                                  <Text style={styles.myMastermindCardSub}>Join Price: {item.joinPrice} SOL</Text>
                                )}
                                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm, alignItems: 'center', justifyContent: 'flex-end' }}>
                                  {isOwner && (
                                    <Pressable 
                                      style={styles.myMastermindCardBtn} 
                                      onPress={() => {
                                        setShowEditModal(false);
                                        // Find the group and set up edit modal
                                        const publicGroup = publicGroups.find(g => 
                                          g.id === (item as any).apiGroupId || 
                                          g.id === item.id || 
                                          (g as any).apiGroupId === item.id
                                        );
                                        setEditingGroupId(item.id);
                                        setEditingGroupImage(publicGroup?.backgroundImage || backgroundImage || null);
                                        setEditingGroupPrice(String(item.joinPrice || 0));
                                        setShowEditGroupModal(true);
                                      }}
                                    >
                                      <Text style={styles.myMastermindCardBtnText}>Edit</Text>
                                    </Pressable>
                                  )}
                                  {!isOwner && (
                                    <Pressable 
                                      style={[styles.myMastermindCardBtn, { backgroundColor: colors.error.main + '30', borderColor: colors.error.main, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]} 
                                      onPress={() => {
                                        // Find the group to get its ID
                                        const groupToLeave = publicGroups.find(g => 
                                          g.id === (item as any).apiGroupId || 
                                          g.id === item.id || 
                                          (g as any).apiGroupId === item.id
                                        ) || item;
                                        
                                        setLeavingGroupId(groupToLeave.id || item.id);
                                      }}
                                      disabled={verifyingLeave}
                                    >
                                      <Ionicons name="exit-outline" size={16} color={colors.error.main} style={{ marginRight: spacing.xs }} />
                                      <Text style={[styles.myMastermindCardBtnText, { color: colors.error.main }]}>Leave</Text>
                                    </Pressable>
                                  )}
                                  <Link href={`/masterminds/${item.id}`} asChild>
                                    <Pressable style={{ 
                                      flex: 1, 
                                      minWidth: '60%',
                                      backgroundColor: colors.success.main + '50',
                                      borderColor: colors.success.main,
                                      borderWidth: 2,
                                      borderRadius: borderRadius.sm,
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      paddingHorizontal: spacing.lg,
                                      paddingVertical: spacing.sm,
                                      gap: spacing.xs
                                    }}>
                                      <Ionicons name="chatbubbles" size={18} color={colors.success.main} />
                                      <Text style={{ 
                                        color: colors.success.main, 
                                        fontWeight: typography.weights.bold,
                                        fontSize: typography.sizes.sm
                                      }}>Open</Text>
                                    </Pressable>
                                  </Link>
                                </View>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.hint}>No Masterminds yet. Create one above.</Text>
                  );
                })()}
              </View>

              {/* X Account Sync */}
              <View style={styles.detailSection}>
                <Text style={styles.label}>X (Twitter) Account</Text>
                <Text style={styles.hint}>
                  Sync your X account to get a verified badge on your username
                </Text>
                <View style={styles.row}>
                  <TextInput
                    value={tempXHandle}
                    onChangeText={setTempXHandle}
                    placeholder="@username"
                    placeholderTextColor={colors.text.tertiary}
                    style={[styles.input, { flex: 1 }]}
                    editable={!syncingX}
                  />
                  <Pressable
                    style={[styles.saveBtn, syncingX && styles.saveBtnDisabled]}
                    onPress={async () => {
                      if (!tempXHandle.trim()) {
                        Alert.alert('Error', 'Please enter your X handle');
                        return;
                      }
                      setSyncingX(true);
                      try {
                        await syncXAccount(tempXHandle.trim());
                        Alert.alert('Success', 'X account synced successfully!');
                        setShowEditModal(false);
                      } catch (error: any) {
                        Alert.alert('Error', error.message || 'Failed to sync X account');
                      } finally {
                        setSyncingX(false);
                      }
                    }}
                    disabled={syncingX}
                  >
                    {syncingX ? (
                      <ActivityIndicator size="small" color={colors.primary.main} />
                    ) : (
                      <Text style={styles.saveBtnText}>Sync</Text>
                    )}
                  </Pressable>
                </View>
                {xHandle && (
                  <Text style={styles.hint}>
                    Currently synced: @{xHandle} {verified && '✓ Verified'}
                  </Text>
                )}
              </View>

              {/* Disconnect Wallet */}
              <View style={styles.detailSection}>
                <Text style={styles.label}>Wallet Connection</Text>
                <Text style={styles.hint}>
                  Disconnect your wallet to connect a different one. Your username will change if you connect a different wallet.
                </Text>
                <Pressable
                  style={styles.disconnectBtn}
                  onPress={() => {
                    Alert.alert(
                      'Disconnect Wallet',
                      'Are you sure you want to disconnect your wallet? You will need to reconnect to use Mastermind features.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Disconnect',
                          style: 'destructive',
                          onPress: () => {
                            disconnectWallet();
                            setShowEditModal(false);
                            Alert.alert('Disconnected', 'Wallet has been disconnected.');
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="log-out-outline" size={18} color={colors.error.main} />
                  <Text style={styles.disconnectBtnText}>Disconnect Wallet</Text>
                </Pressable>
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Close</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.lg, gap: spacing.md },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  input: { 
    ...components.input, 
    flex: 1,
    color: colors.text.primary, // Explicitly set text color
  },
  primaryBtn: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  primaryBtnText: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  card: { ...components.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitle: { fontWeight: typography.weights.semibold, color: colors.text.primary, flex: 1, marginRight: spacing.sm },
  cardSub: { color: colors.text.secondary, fontSize: typography.sizes.sm },
  secondaryBtn: { borderWidth: 2, borderColor: colors.primary.main, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  secondaryBtnText: { color: colors.primary.main, fontWeight: typography.weights.semibold },
  info: { textAlign: 'center', color: colors.text.secondary },
  verifyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  verifyTitle: { fontWeight: typography.weights.bold, color: colors.text.primary, fontSize: typography.sizes.lg },
  verifyText: { color: colors.text.secondary, marginTop: spacing.xs },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  profileGradientBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    ...shadows.sm,
  },
  profileGradientBtnInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  profileDisplayValue: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  profileLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  profileValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.success.main,
  },
  xHandleText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  addressText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontFamily: 'monospace',
  },
  setUsernameBtn: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(123, 163, 212, 0.2)',
    alignSelf: 'flex-start',
  },
  setUsernameBtnText: {
    color: colors.primary.main,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  modalInput: {
    width: '100%',
    marginTop: spacing.xs,
    color: colors.text.primary, // Ensure text is visible
  },
  modalInputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    minHeight: 48,
    width: '100%',
    marginTop: spacing.xs,
  },
  inputError: {
    borderColor: colors.error.main,
    borderWidth: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error.main,
    flex: 1,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.error.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    marginTop: spacing.sm,
  },
  disconnectBtnText: {
    color: colors.error.main,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  editProfileBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(123, 163, 212, 0.2)',
  },
  editProfileBtnText: {
    color: colors.primary.main,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  saveBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(123, 163, 212, 0.2)',
  },
  saveBtnText: {
    color: colors.primary.main,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: colors.text.tertiary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelBtnText: {
    color: colors.text.tertiary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  discoverCard: {
    ...components.card,
    padding: spacing.md,
  },
  discoverCardWrapper: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  discoverCardContainer: {
    position: 'relative',
    minHeight: 160,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  discoverCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  discoverCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  discoverCardGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 120,
    justifyContent: 'center',
  },
  discoverCardContent: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  discoverCardTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  discoverCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  discoverCardMetaText: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.weights.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  priceBadge: {
    backgroundColor: 'rgba(123, 163, 212, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(123, 163, 212, 0.5)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  freeBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  priceText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  priceBadgeColored: {
    backgroundColor: 'rgba(123, 163, 212, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(123, 163, 212, 0.7)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  freeBadgeColored: {
    backgroundColor: 'rgba(139, 195, 74, 0.4)',
    borderColor: 'rgba(139, 195, 74, 0.7)',
  },
  priceTextColored: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  cardDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  cardMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  viewBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(123, 163, 212, 0.2)',
    alignItems: 'center',
  },
  viewBtnText: {
    color: colors.primary.main,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  joinBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(123, 163, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnDisabled: {
    opacity: 0.5,
  },
  joinBtnText: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  publicBadge: {
    backgroundColor: 'rgba(123, 163, 212, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(123, 163, 212, 0.4)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  publicBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary.main,
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  testingBanner: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.4)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  testingBannerText: {
    fontSize: typography.sizes.xs,
    color: '#FFC107',
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  feeNote: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background.gradient.end,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  modalCloseText: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  detailValueContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  detailValue: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  detailTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  detailText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: typography.sizes.base * 1.6,
  },
  priceBadgeLarge: {
    backgroundColor: 'rgba(123, 163, 212, 0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(123, 163, 212, 0.5)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignSelf: 'flex-start',
  },
  freeBadgeLarge: {
    backgroundColor: 'rgba(139, 195, 74, 0.3)',
    borderColor: 'rgba(139, 195, 74, 0.5)',
  },
  priceTextLarge: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  modalBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: 'rgba(123, 163, 212, 0.3)',
    borderColor: 'rgba(123, 163, 212, 0.5)',
  },
  modalBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  modalBtnPrimaryText: {
    color: colors.text.primary,
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },
  modalSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // My Mastermind Card Styles
  myMastermindCardWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  myMastermindCardContainer: {
    position: 'relative',
    minHeight: 180,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  myMastermindCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  myMastermindCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  myMastermindCardContent: {
    position: 'relative',
    zIndex: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  myMastermindCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  myMastermindCardTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  myMastermindCardSub: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  myMastermindCardDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  myMastermindCardBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  myMastermindCardBtnText: {
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  // Modal Image Styles
  modalImageContainer: {
    width: '100%',
    height: 200,
    marginTop: -spacing.lg,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Image Picker Styles
  imagePickerContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  imagePickerBtn: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  imagePickerBtnDisabled: {
    opacity: 0.5,
  },
  imagePickerText: {
    color: colors.primary.main,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  imagePickerHint: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    height: 180,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  ownerBadge: {
    width: '100%',
    backgroundColor: 'rgba(127, 179, 168, 0.2)',
    borderColor: 'rgba(127, 179, 168, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerBadgeText: {
    color: colors.success.main,
  },
  // Category Selection Styles (for create modal)
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryButtonSelected: {
    borderColor: colors.primary.main,
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
  },
  categoryButtonText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  categoryButtonTextSelected: {
    color: colors.primary.main,
    fontWeight: typography.weights.semibold,
  },
  // Category Filter Styles (for Discover page)
  categoryFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryFilterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryFilterButtonActive: {
    borderColor: colors.primary.main,
    backgroundColor: 'rgba(123, 97, 255, 0.25)',
  },
  categoryFilterText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  categoryFilterTextActive: {
    color: colors.primary.main,
    fontWeight: typography.weights.semibold,
  },
  // Category Badge Styles (for cards)
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.4)',
  },
  categoryBadgeText: {
    color: colors.primary.main,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  categoryBadgeSmall: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
  },
  categoryBadgeTextSmall: {
    color: colors.primary.main,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  discoverCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  // Open Chat Button Styles
  openChatButton: {
    width: '100%',
    backgroundColor: 'rgba(123, 97, 255, 0.3)',
    borderColor: colors.primary.main,
    borderWidth: 2,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openChatButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  // Carousel Styles
  carouselContainer: {
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  discoverCardCarousel: {
    width: 280,
    marginRight: spacing.md,
  },
  discoverCardContainerCarousel: {
    minHeight: 200,
  },
  // Delete Modal Styles
  modalBtnDanger: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
    borderColor: colors.error.main,
    borderWidth: 2,
  },
  modalBtnDangerText: {
    color: colors.error.main,
  },
});
