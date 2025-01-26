const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.addLike = functions.firestore
    .document('/posts/{creatorId}/userPosts/{postId}/likes/{userId}')
    .onCreate(async (snap, context) => {
        try {
            const { creatorId, postId } = context.params;
            await db
                .collection("posts")
                .doc(creatorId)
                .collection("userPosts")
                .doc(postId)
                .update({
                    likesCount: admin.firestore.FieldValue.increment(1),
                });
        } catch (error) {
            console.error('Error adding like:', error);
        }
    });

exports.removeLike = functions.firestore
    .document('/posts/{creatorId}/userPosts/{postId}/likes/{userId}')
    .onDelete(async (snap, context) => {
        try {
            const { creatorId, postId } = context.params;
            await db
                .collection("posts")
                .doc(creatorId)
                .collection("userPosts")
                .doc(postId)
                .update({
                    likesCount: admin.firestore.FieldValue.increment(-1),
                });
        } catch (error) {
            console.error('Error removing like:', error);
        }
    });

exports.addFollower = functions.firestore
    .document('/following/{userId}/userFollowing/{FollowingId}')
    .onCreate(async (snap, context) => {
        try {
            const { userId, FollowingId } = context.params;

            await db
                .collection("users")
                .doc(FollowingId)
                .update({
                    followersCount: admin.firestore.FieldValue.increment(1),
                });

            await db
                .collection("users")
                .doc(userId)
                .update({
                    followingCount: admin.firestore.FieldValue.increment(1),
                });
        } catch (error) {
            console.error('Error adding follower:', error);
        }
    });

exports.removeFollower = functions.firestore
    .document('/following/{userId}/userFollowing/{FollowingId}')
    .onDelete(async (snap, context) => {
        try {
            const { userId, FollowingId } = context.params;

            await db
                .collection("users")
                .doc(FollowingId)
                .update({
                    followersCount: admin.firestore.FieldValue.increment(-1),
                });

            await db
                .collection("users")
                .doc(userId)
                .update({
                    followingCount: admin.firestore.FieldValue.increment(-1),
                });
        } catch (error) {
            console.error('Error removing follower:', error);
        }
    });

exports.addComment = functions.firestore
    .document('/posts/{creatorId}/userPosts/{postId}/comments/{userId}')
    .onCreate(async (snap, context) => {
        try {
            const { creatorId, postId } = context.params;
            await db
                .collection("posts")
                .doc(creatorId)
                .collection("userPosts")
                .doc(postId)
                .update({
                    commentsCount: admin.firestore.FieldValue.increment(1),
                });
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    });
