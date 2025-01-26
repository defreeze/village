import { FontAwesome5 } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, collection, query, orderBy, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { sendNotification } from '../../../redux/actions/index';
import { container, text, utils } from '../../styles';
import CachedImage from '../random/CachedImage';

function Profile(props) {
    const [userPosts, setUserPosts] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);

    const firestore = getFirestore();
    const auth = getAuth();

    useEffect(() => {
        const fetchUserData = async () => {
            const { currentUser, posts } = props;

            if (props.route.params.uid === auth.currentUser.uid) {
                setUser(currentUser);
                setUserPosts(posts);
                setLoading(false);
            } else {
                try {
                    const userDoc = doc(firestore, "users", props.route.params.uid);
                    const userSnapshot = await getDoc(userDoc);

                    if (userSnapshot.exists()) {
                        props.navigation.setOptions({
                            title: userSnapshot.data().username,
                        });
                        setUser({ uid: props.route.params.uid, ...userSnapshot.data() });
                    }

                    const postsQuery = query(
                        collection(firestore, "posts", props.route.params.uid, "userPosts"),
                        orderBy("creation", "desc")
                    );
                    const postsSnapshot = await getDocs(postsQuery);
                    const userPostsData = postsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setUserPosts(userPostsData);

                } catch (error) {
                    console.error("Error fetching user data:", error);
                } finally {
                    setLoading(false);
                }
            }

            setFollowing(props.following.includes(props.route.params.uid));
        };

        fetchUserData();
    }, [props.route.params.uid, props.following, props.currentUser, props.posts]);

    const onFollow = async () => {
        try {
            const followDoc = doc(firestore, "following", auth.currentUser.uid, "userFollowing", props.route.params.uid);
            await setDoc(followDoc, {});

            props.sendNotification(
                user.notificationToken,
                "New Follower",
                `${props.currentUser.name} started following you`,
                { type: 'profile', user: auth.currentUser.uid }
            );
        } catch (error) {
            console.error("Error following user:", error);
        }
    };

    const onUnfollow = async () => {
        try {
            const followDoc = doc(firestore, "following", auth.currentUser.uid, "userFollowing", props.route.params.uid);
            await deleteDoc(followDoc);
        } catch (error) {
            console.error("Error unfollowing user:", error);
        }
    };

    if (loading) {
        return (
            <View style={{ height: '100%', justifyContent: 'center', margin: 'auto' }}>
                <ActivityIndicator style={{ alignSelf: 'center', marginBottom: 20 }} size="large" color="#00ff00" />
                <Text style={[text.notAvailable]}>Loading</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={{ height: '100%', justifyContent: 'center', margin: 'auto' }}>
                <FontAwesome5 style={{ alignSelf: 'center', marginBottom: 20 }} name="dizzy" size={40} color="black" />
                <Text style={[text.notAvailable]}>User Not Found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[container.container, utils.backgroundWhite]}>
            <View style={[container.profileInfo]}>
                <View style={[utils.noPadding, container.row]}>
                    {user.image === 'default' ? (
                        <FontAwesome5
                            style={[utils.profileImageBig, utils.marginBottomSmall]}
                            name="user-circle"
                            size={80}
                            color="black"
                        />
                    ) : (
                        <Image
                            style={[utils.profileImageBig, utils.marginBottomSmall]}
                            source={{ uri: user.image }}
                        />
                    )}
                    <View style={[container.container, container.horizontal, utils.justifyCenter, utils.padding10Sides]}>
                        <View style={[utils.justifyCenter, text.center, container.containerImage]}>
                            <Text style={[text.bold, text.large, text.center]}>{userPosts.length}</Text>
                            <Text style={[text.center]}>Posts</Text>
                        </View>
                        <View style={[utils.justifyCenter, text.center, container.containerImage]}>
                            <Text style={[text.bold, text.large, text.center]}>{user.followersCount}</Text>
                            <Text style={[text.center]}>Followers</Text>
                        </View>
                        <View style={[utils.justifyCenter, text.center, container.containerImage]}>
                            <Text style={[text.bold, text.large, text.center]}>{user.followingCount}</Text>
                            <Text style={[text.center]}>Following</Text>
                        </View>
                    </View>
                </View>

                <View>
                    <Text style={text.bold}>{user.name}</Text>
                    <Text style={[text.profileDescription, utils.marginBottom]}>{user.description}</Text>

                    {props.route.params.uid !== auth.currentUser.uid ? (
                        <View style={[container.horizontal]}>
                            {following ? (
                                <TouchableOpacity
                                    style={[utils.buttonOutlined, container.container, utils.margin15Right]}
                                    onPress={onUnfollow}
                                >
                                    <Text style={[text.bold, text.center, text.green]}>Following</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[utils.buttonOutlined, container.container, utils.margin15Right]}
                                    onPress={onFollow}
                                >
                                    <Text style={[text.bold, text.center, { color: '#2196F3' }]}>Follow</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[utils.buttonOutlined, container.container]}
                                onPress={() => props.navigation.navigate('Chat', { user })}
                            >
                                <Text style={[text.bold, text.center]}>Message</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={utils.buttonOutlined}
                            onPress={() => props.navigation.navigate('Edit')}
                        >
                            <Text style={[text.bold, text.center]}>Edit Profile</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={[utils.borderTopGray]}>
                <FlatList
                    numColumns={3}
                    horizontal={false}
                    data={userPosts}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[container.containerImage, utils.borderWhite]}
                            onPress={() => props.navigation.navigate("Post", { item, user })}
                        >
                            {item.type === 0 ? (
                                <CachedImage cacheKey={item.id} style={container.image} source={{ uri: item.downloadURLStill }} />
                            ) : (
                                <CachedImage cacheKey={item.id} style={container.image} source={{ uri: item.downloadURL }} />
                            )}
                        </TouchableOpacity>
                    )}
                />
            </View>
        </ScrollView>
    );
}

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
    posts: store.userState.posts,
    following: store.userState.following,
});

const mapDispatchProps = (dispatch) => bindActionCreators({ sendNotification }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Profile);
