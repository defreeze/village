import { Feather } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { container, utils } from '../../styles';

const WINDOW_HEIGHT = Dimensions.get("window").height;
const WINDOW_WIDTH = Dimensions.get("window").width;
const closeButtonSize = Math.floor(WINDOW_HEIGHT * 0.032);
const captureSize = Math.floor(WINDOW_HEIGHT * 0.09);

export default function VideoScreen(props) {
    const [hasPermission, setHasPermission] = useState(null);
    const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
    const [isPreview, setIsPreview] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isFlash, setIsFlash] = useState(false);
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const [type, setType] = useState(0);
    const [showGallery, setShowGallery] = useState(true);
    const [galleryItems, setGalleryItems] = useState([]);
    const [galleryScrollRef, setGalleryScrollRef] = useState(null);
    const [galleryPickedImage, setGalleryPickedImage] = useState(null);
    const cameraRef = useRef();
    const isFocused = useIsFocused();

    useEffect(() => {
        (async () => {
            const cameraPermissions = await Camera.requestPermissionsAsync();
            const galleryPermissions = await MediaLibrary.requestPermissionsAsync();
            const audioPermissions = await Audio.requestPermissionsAsync();

            if (cameraPermissions.status === 'granted' &&
                audioPermissions.status === 'granted' &&
                galleryPermissions.status === 'granted') {
                const getPhotos = await MediaLibrary.getAssetsAsync({ sortBy: ['creationTime'], mediaType: ['photo', 'video'] });
                setGalleryItems(getPhotos);
                setGalleryPickedImage(getPhotos.assets[0]);
                setHasPermission(true);
            }
        })();
    }, []);

    const onCameraReady = () => {
        setIsCameraReady(true);
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            const options = { quality: 0.5, base64: true, skipProcessing: true };
            const data = await cameraRef.current.takePictureAsync(options);
            const source = data.uri;
            if (source) {
                props.navigation.navigate('Save', { source, imageSource: null, type });
            }
        }
    };

    const recordVideo = async () => {
        if (cameraRef.current) {
            try {
                const options = { maxDuration: 60, quality: Camera.Constants.VideoQuality['480p'] };
                const videoRecordPromise = cameraRef.current.recordAsync(options);
                if (videoRecordPromise) {
                    setIsVideoRecording(true);
                    const data = await videoRecordPromise;
                    const source = data.uri;
                    const imageSource = await generateThumbnail(source);
                    props.navigation.navigate('Save', { source, imageSource, type });
                }
            } catch (error) {
                console.warn(error);
            }
        }
    };

    const generateThumbnail = async (source) => {
        try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(source, {
                time: 5000,
            });
            return uri;
        } catch (e) {
            console.warn(e);
        }
    };

    const stopVideoRecording = async () => {
        if (cameraRef.current) {
            setIsVideoRecording(false);
            cameraRef.current.stopRecording();
        }
    };

    const switchCamera = () => {
        if (isPreview) return;
        setCameraType((prevCameraType) =>
            prevCameraType === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
        );
    };

    const handleGoToSaveOnGalleryPick = async () => {
        const type = galleryPickedImage.mediaType === 'video' ? 0 : 1;
        const loadedAsset = await MediaLibrary.getAssetInfoAsync(galleryPickedImage);
        const imageSource = type === 0 ? await generateThumbnail(galleryPickedImage.uri) : null;

        props.navigation.navigate('Save', {
            source: loadedAsset.localUri,
            type,
            imageSource,
        });
    };

    const renderCaptureControl = () => (
        <View style={{ justifyContent: 'space-evenly', width: '100%', alignItems: 'center', flexDirection: 'row', backgroundColor: 'white' }}>
            <TouchableOpacity disabled={!isCameraReady} onPress={() => setIsFlash(!isFlash)}>
                <Feather style={utils.margin15} name={"zap"} size={25} color="black" />
            </TouchableOpacity>
            <TouchableOpacity disabled={!isCameraReady} onPress={switchCamera}>
                <Feather style={utils.margin15} name="rotate-cw" size={25} color="black" />
            </TouchableOpacity>
            {type === 0 ? (
                <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={!isCameraReady}
                    onLongPress={recordVideo}
                    onPressOut={stopVideoRecording}
                    style={styles.capture}
                />
            ) : (
                <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={!isCameraReady}
                    onPress={takePicture}
                    style={styles.capturePicture}
                />
            )}
            <TouchableOpacity disabled={!isCameraReady} onPress={() => setType(type === 1 ? 0 : 1)}>
                <Feather style={utils.margin15} name={type === 0 ? "camera" : "video"} size={25} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGallery(true)}>
                <Feather style={utils.margin15} name={"image"} size={25} color="black" />
            </TouchableOpacity>
        </View>
    );

    if (hasPermission === null) return <View />;
    if (hasPermission === false) return <Text style={styles.text}>No access to camera</Text>;

    if (showGallery) {
        return (
            <ScrollView
                ref={(ref) => setGalleryScrollRef(ref)}
                style={[container.container, utils.backgroundWhite]}
            >
                <View style={{ aspectRatio: 1, height: WINDOW_WIDTH }}>
                    <Image
                        style={{ flex: 1 }}
                        source={{ uri: galleryPickedImage.uri }}
                    />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', margin: 10 }}>
                    <TouchableOpacity style={styles.galleryButton} onPress={handleGoToSaveOnGalleryPick}>
                        <Text style={styles.galleryButtonText}>Continue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.galleryIcon} onPress={() => setShowGallery(false)}>
                        <Feather name={"camera"} size={20} color="white" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    numColumns={3}
                    horizontal={false}
                    data={galleryItems.assets}
                    contentContainerStyle={{ flexGrow: 1 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[container.containerImage, utils.borderWhite]}
                            onPress={() => {
                                galleryScrollRef.scrollTo({ x: 0, y: 0, animated: true });
                                setGalleryPickedImage(item);
                            }}
                        >
                            <Image
                                style={container.image}
                                source={{ uri: item.uri }}
                            />
                        </TouchableOpacity>
                    )}
                />
            </ScrollView>
        );
    }

    return (
        <View style={{ flex: 1, flexDirection: 'column', backgroundColor: 'white' }}>
            <View style={{ aspectRatio: 1, height: WINDOW_WIDTH }}>
                {isFocused && (
                    <Camera
                        ref={cameraRef}
                        type={cameraType}
                        flashMode={isFlash ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
                        style={{ flex: 1 }}
                        onCameraReady={onCameraReady}
                    />
                )}
            </View>
            {renderCaptureControl()}
        </View>
    );
}

const styles = StyleSheet.create({
    text: {
        color: "#000000",
    },
    capture: {
        backgroundColor: "red",
        height: captureSize,
        width: captureSize,
        borderRadius: captureSize / 2,
    },
    capturePicture: {
        borderWidth: 6,
        borderColor: 'gray',
        backgroundColor: "white",
        height: captureSize,
        width: captureSize,
        borderRadius: captureSize / 2,
    },
    galleryButton: {
        alignItems: 'center',
        backgroundColor: 'gray',
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginRight: 15,
        borderRadius: 50,
    },
    galleryButtonText: {
        fontWeight: 'bold',
        color: 'white',
    },
    galleryIcon: {
        alignItems: 'center',
        backgroundColor: 'gray',
        borderRadius: 50,
        padding: 10,
    },
});

