import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Updates from 'expo-updates';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Button, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { updateUserFeedPosts } from '../../../redux/actions/index';
import { container, form, navbar, text, utils } from '../../styles';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Edit(props) {
    const auth = getAuth();
    const firestore = getFirestore();
    const storage = getStorage();

    const [name, setName] = useState(props.currentUser.name);
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(props.currentUser.image);
    const [imageChanged, setImageChanged] = useState(false);

    const onLogout = async () => {
        await signOut(auth);
        Updates.reloadAsync();
    };

    useEffect(() => {
        if (props.currentUser.description) {
            setDescription(props.currentUser.description);
        }
    }, [props.currentUser]);

    useLayoutEffect(() => {
        props.navigation.setOptions({
            headerRight: () => (
                <Feather
                    style={navbar.image}
                    name="check"
                    size={24}
                    color="green"
                    onPress={() => Save()}
                />
            ),
        });
    }, [props.navigation, name, description, image, imageChanged]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.cancelled) {
            setImage(result.uri);
            setImageChanged(true);
        }
    };

    const Save = async () => {
        if (imageChanged) {
            const uri = image;
            const childPath = `profile/${auth.currentUser.uid}`;

            const response = await fetch(uri);
            const blob = await response.blob();

            const storageRef = ref(storage, childPath);
            const uploadTask = await uploadBytes(storageRef, blob);

            const downloadURL = await getDownloadURL(uploadTask.ref);

            await saveData({
                name,
                description,
                image: downloadURL,
            });
        } else {
            await saveData({ name, description });
        }
    };

    const saveData = async (data) => {
        const userDocRef = doc(firestore, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, data);
        props.updateUserFeedPosts();
        props.navigation.goBack();
    };

    return (
        <View style={container.form}>
            <TouchableOpacity
                style={[utils.centerHorizontal, utils.marginBottom]}
                onPress={pickImage}
            >
                {image === 'default' ? (
                    <FontAwesome5
                        style={[utils.profileImageBig, utils.marginBottomSmall]}
                        name="user-circle"
                        size={80}
                        color="black"
                    />
                ) : (
                    <Image
                        style={[utils.profileImageBig, utils.marginBottomSmall]}
                        source={{ uri: image }}
                    />
                )}
                <Text style={text.changePhoto}>Change Profile Photo</Text>
            </TouchableOpacity>

            <TextInput
                value={name}
                style={form.textInput}
                placeholder="Name"
                onChangeText={setName}
            />
            <TextInput
                value={description}
                style={form.textInput}
                placeholderTextColor="#e8e8e8"
                placeholder="Description"
                onChangeText={setDescription}
            />
            <Button title="Logout" onPress={onLogout} />
        </View>
    );
}

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
});

const mapDispatchProps = (dispatch) =>
    bindActionCreators({ updateUserFeedPosts }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Edit);
