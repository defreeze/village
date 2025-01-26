import { Entypo, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Video } from 'expo-av';
import VideoPlayer from 'expo-video-player';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import BottomSheet from 'react-native-bottomsheet-reanimated';
import { Divider, Snackbar } from 'react-native-paper';
import ParsedText from 'react-native-parsed-text';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { deletePost, fetchUserPosts, sendNotification } from '../../../redux/actions/index';
import { container, text, utils } from '../../styles';
import { timeDifference } from '../../utils';
import CachedImage from '../random/CachedImage';
import { getAuth } from 'firebase/auth';
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    onSnapshot,
    query,
    orderBy,
    setDoc,
    deleteDoc,
} from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

const WINDOW_WIDTH = Dimensions.get('window').width;

function Post(props) {
    const [item, setItem] = useState(props.route.params.item);
    const [user, setUser] = useState(props.route.params.user);
    const [currentUserLike, setCurrentUserLike] = useState(false);
    const [unmutted, setUnmutted] = useState(true);
    const [videoref, setVideoref] = useState(null);
    const [sheetRef, setSheetRef] = useState(useRef(null));
    const [modalShow, setModalShow] = useState({ visible: false, item: null });
    const [isValid, setIsValid] = useState(true);
    const [exists, setExists] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const isFocused = useIsFocused();

    useEffect(() => {
        const fetchPostData = async () => {
            if (props.route.params.notification) {
                const userRef = doc(db, 'users', props.route.params.user);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = { ...userSnap.data(), uid: userSnap.id };
                    setUser(userData);
                }

                const postRef = doc(db, 'posts', props.route.params.user, 'userPosts', props.route.params.item);
                const postSnap = await getDoc(postRef);
                if (postSnap.exists()) {
                    const postData = { ...postSnap.data(), id: postSnap.id };
                    setItem(postData);
                    setExists(true);
                }

                const likesRef = doc(postRef, 'likes', auth.currentUser.uid);
                onSnapshot(likesRef, (snapshot) => {
                    setCurrentUserLike(snapshot.exists());
                });
            } else {
                const likesRef = doc(
                    db,
                    'posts',
                    props.route.params.user.uid,
                    'userPosts',
                    props.route.params.item.id,
                    'likes',
                    auth.currentUser.uid
                );
                onSnapshot(likesRef, (snapshot) => {
                    setCurrentUserLike(snapshot.exists());
                });

                setItem(props.route.params.item);
                setUser(props.route.params.user);
                setExists(true);
            }

            setLoaded(true);
        };

        fetchPostData();
    }, [props.route.params.notification, props.route.params.item]);

    useEffect(() => {
        if (videoref) {
            videoref.setIsMutedAsync(props.route.params.unmutted);
        }
        setUnmutted(props.route.params.unmutted);
    }, [props.route.params.unmutted]);

    useEffect(() => {
        if (videoref) {
            if (isFocused) {
                videoref.playAsync();
            } else {
                videoref.stopAsync();
            }
        }
    }, [props.route.params.index, props.route.params.inViewPort]);

    const onLikePress = async (userId, postId, item) => {
        item.likesCount += 1;
        setCurrentUserLike(true);

        const likesRef = doc(db, 'posts', userId, 'userPosts', postId, 'likes', auth.currentUser.uid);
        await setDoc(likesRef, {});

        props.sendNotification(user.notificationToken, 'New Like', `${props.currentUser.name} liked your post`, {
            type: 0,
            postId,
            user: auth.currentUser.uid,
        });
    };

    const onDislikePress = async (userId, postId, item) => {
        item.likesCount -= 1;
        setCurrentUserLike(false);

        const likesRef = doc(db, 'posts', userId, 'userPosts', postId, 'likes', auth.currentUser.uid);
        await deleteDoc(likesRef);
    };

    if (!exists && loaded) {
        return (
            <View style={{ height: '100%', justifyContent: 'center', margin: 'auto' }}>
                <FontAwesome5 style={{ alignSelf: 'center', marginBottom: 20 }} name="dizzy" size={40} color="black" />
                <Text style={[text.notAvailable]}>Post does not exist</Text>
            </View>
        );
    }

    if (!loaded || user === undefined || item === null) {
        return <View />;
    }

    const _handleVideoRef = (component) => {
        setVideoref(component);
        if (component) {
            component.setIsMutedAsync(props.route.params.unmutted);
        }
    };

    if (videoref) {
        videoref.setIsMutedAsync(unmutted);
        if (isFocused && props.route.params.index === props.route.params.inViewPort) {
            videoref.playAsync();
        } else {
            videoref.stopAsync();
        }
    }

    if (sheetRef.current && !props.route.params.feed) {
        modalShow.visible ? sheetRef.snapTo(0) : sheetRef.snapTo(1);
    }

    return (
        <View style={[container.container, utils.backgroundWhite]}>
            {/* Post Header */}
            {/* Post Content */}
            {/* Post Footer */}
            {/* Bottom Sheet */}
        </View>
    );
}

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
});

const mapDispatchProps = (dispatch) =>
    bindActionCreators({ sendNotification, fetchUserPosts, deletePost }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Post);
