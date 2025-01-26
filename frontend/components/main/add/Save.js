import { Feather } from '@expo/vector-icons';
import { Video } from 'expo-av';
import React, { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MentionsTextInput from 'react-native-mentions';
import { Snackbar } from 'react-native-paper';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchUserPosts, sendNotification } from '../../../redux/actions/index';
import { container, navbar, text, utils } from '../../styles';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

function Save(props) {
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(false);
    const [data, setData] = useState([]);
    const [keyword, setKeyword] = useState("");

    useLayoutEffect(() => {
        props.navigation.setOptions({
            headerRight: () => (
                <Feather style={navbar.image} name="check" size={24} color="green" onPress={uploadImage} />
            ),
        });
    }, [caption]);

    const uploadImage = async () => {
        if (uploading) return;

        setUploading(true);

        try {
            const downloadURL = await saveToStorage(props.route.params.source, `post/${auth.currentUser.uid}/${Math.random().toString(36)}`);
            let downloadURLStill = null;

            if (props.route.params.imageSource != null) {
                downloadURLStill = await saveToStorage(props.route.params.imageSource, `post/${auth.currentUser.uid}/${Math.random().toString(36)}`);
            }

            await savePostData(downloadURL, downloadURLStill);
        } catch (err) {
            setError(true);
            setUploading(false);
            console.error('Upload failed:', err.message);
        }
    };

    const saveToStorage = async (image, path) => {
        if (image === 'default') return '';

        const fileRef = ref(storage, path);
        const response = await fetch(image);
        const blob = await response.blob();
        await uploadBytes(fileRef, blob);

        const downloadURL = await getDownloadURL(fileRef);
        return downloadURL;
    };

    const savePostData = async (downloadURL, downloadURLStill) => {
        const postObject = {
            downloadURL,
            caption,
            likesCount: 0,
            commentsCount: 0,
            type: props.route.params.type,
            creation: serverTimestamp(),
        };

        if (downloadURLStill) {
            postObject.downloadURLStill = downloadURLStill;
        }

        try {
            const userPostsRef = collection(db, 'posts', auth.currentUser.uid, 'userPosts');
            await addDoc(userPostsRef, postObject);

            props.fetchUserPosts();
            props.navigation.popToTop();

            const mentions = caption.match(/\B@[a-z0-9_-]+/gi);
            if (mentions) {
                for (const mention of mentions) {
                    const usersQuery = query(collection(db, 'users'), where('username', '==', mention.substring(1)));
                    const snapshot = await getDocs(usersQuery);

                    snapshot.forEach((doc) => {
                        props.sendNotification(
                            doc.data().notificationToken,
                            'New tag',
                            `${props.currentUser.name} tagged you in a post`,
                            { type: 0, user: auth.currentUser.uid }
                        );
                    });
                }
            }
        } catch (err) {
            setUploading(false);
            setError(true);
            console.error('Error saving post:', err.message);
        }
    };

    const renderSuggestionsRow = ({ item }, hidePanel) => (
        <TouchableOpacity onPress={() => onSuggestionTap(item.username, hidePanel)}>
            <View style={styles.suggestionsRowContainer}>
                <View style={styles.userIconBox}>
                    <Image
                        style={{ aspectRatio: 1, height: 45 }}
                        source={{ uri: item.image }}
                    />
                </View>
                <View style={styles.userDetailsBox}>
                    <Text style={styles.displayNameText}>{item.name}</Text>
                    <Text style={styles.usernameText}>@{item.username}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const onSuggestionTap = (username, hidePanel) => {
        hidePanel();
        const comment = caption.slice(0, -keyword.length);
        setCaption(`${comment}@${username} `);
    };

    const callback = async (keyword) => {
        setKeyword(keyword);
        const usersQuery = query(collection(db, 'users'), where('username', '>=', keyword.substring(1)));
        const snapshot = await getDocs(usersQuery);

        const result = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        setData(result);
    };

    return (
        <View style={[container.container, utils.backgroundWhite]}>
            {uploading ? (
                <View style={[container.container, utils.justifyCenter, utils.alignItemsCenter]}>
                    <ActivityIndicator style={utils.marginBottom} size="large" />
                    <Text style={[text.bold, text.large]}>Upload in progress...</Text>
                </View>
            ) : (
                <View style={[container.container]}>
                    <View style={[container.container, utils.backgroundWhite, utils.padding15]}>
                        <View style={{ marginBottom: 20, width: '100%' }}>
                            <MentionsTextInput
                                textInputStyle={{ borderColor: '#ebebeb', borderWidth: 1, padding: 5, fontSize: 15, width: '100%' }}
                                suggestionsPanelStyle={{ backgroundColor: 'rgba(100,100,100,0.1)' }}
                                loadingComponent={() => (
                                    <View style={{ flex: 1, width: 200, justifyContent: 'center', alignItems: 'center' }}>
                                        <ActivityIndicator />
                                    </View>
                                )}
                                textInputMinHeight={30}
                                textInputMaxHeight={80}
                                trigger="@"
                                triggerLocation="new-word-only"
                                value={caption}
                                onChangeText={setCaption}
                                triggerCallback={callback}
                                renderSuggestionsRow={renderSuggestionsRow}
                                suggestionsData={data}
                                keyExtractor={(item, index) => item.username}
                                suggestionRowHeight={45}
                                horizontal
                                MaxVisibleRowCount={3}
                            />
                        </View>
                        <View>
                            {props.route.params.type ? (
                                <Image
                                    style={{ aspectRatio: 1, backgroundColor: 'black', width: '100%', height: undefined }}
                                    source={{ uri: props.route.params.source }}
                                />
                            ) : (
                                <Video
                                    source={{ uri: props.route.params.source }}
                                    shouldPlay
                                    isLooping
                                    resizeMode="cover"
                                    style={{ aspectRatio: 1, backgroundColor: 'black' }}
                                />
                            )}
                        </View>
                    </View>
                    <Snackbar visible={error} duration={2000} onDismiss={() => setError(false)}>
                        Something went wrong!
                    </Snackbar>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    suggestionsRowContainer: { flexDirection: 'row' },
    userIconBox: {
        height: 45,
        width: 45,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#54c19c',
    },
    userDetailsBox: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 10,
        paddingRight: 15,
    },
    displayNameText: { fontSize: 13, fontWeight: '500' },
    usernameText: { fontSize: 12, color: 'rgba(0,0,0,0.6)' },
});

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
});

const mapDispatchProps = (dispatch) => bindActionCreators({ fetchUserPosts, sendNotification }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Save);
