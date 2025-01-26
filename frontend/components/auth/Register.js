import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { auth, db } from '../firebase'; // <-- Import from your firebase.js
import { container, form } from '../styles';

export default function Register(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isValid, setIsValid] = useState({
    boolSnack: false,
    message: '',
  });

  async function onRegister() {
    // Basic validation
    if (!name || !username || !email || !password) {
      setIsValid({
        boolSnack: true,
        message: 'Please fill out all fields.',
      });
      return;
    }

    if (password.length < 6) {
      setIsValid({
        boolSnack: true,
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    try {
      // Check if username exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Username already taken
        setIsValid({
          boolSnack: true,
          message: 'Username already taken.',
        });
        return;
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save user data in Firestore
      await setDoc(doc(db, 'users', uid), {
        name,
        email,
        username,
        image: 'default',
        followingCount: 0,
        followersCount: 0,
      });
      
      // User created successfully
      // Navigate or show success message if needed

    } catch (error) {
      setIsValid({
        boolSnack: true,
        message: error.message || 'Something went wrong.',
      });
    }
  }

  return (
    <View style={container.center}>
      <View style={container.formCenter}>
        <TextInput
          style={form.textInput}
          placeholder="Username"
          value={username}
          onChangeText={(val) =>
            setUsername(
              val
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // remove diacritics
                .replace(/\s+/g, '')            // remove whitespace
                .replace(/[^a-z0-9]/gi, '')     // remove special chars
                .toLowerCase()
            )
          }
        />
        <TextInput
          style={form.textInput}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={form.textInput}
          placeholder="Email"
          value={email}
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        <TextInput
          style={form.textInput}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button
          style={form.button}
          onPress={onRegister}
          title="Register"
        />
      </View>

      <View style={form.bottomButton}>
        <Text onPress={() => props.navigation.navigate('Login')}>
          Already have an account? Sign In.
        </Text>
      </View>

      <Snackbar
        visible={isValid.boolSnack}
        duration={2000}
        onDismiss={() => setIsValid({ boolSnack: false, message: '' })}
      >
        {isValid.message}
      </Snackbar>
    </View>
  );
}
