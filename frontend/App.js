import React, { Component } from 'react';
import { Image, LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import _ from 'lodash';
import rootReducer from './redux/reducers'; // Redux root reducer
import LoginScreen from './components/auth/Login';
import RegisterScreen from './components/auth/Register';
import MainScreen from './components/Main';
import SaveScreen from './components/main/add/Save';
import ChatScreen from './components/main/chat/Chat';
import ChatListScreen from './components/main/chat/List';
import CommentScreen from './components/main/post/Comment';
import PostScreen from './components/main/post/Post';
import EditScreen from './components/main/profile/Edit';
import ProfileScreen from './components/main/profile/Profile';
import BlockedScreen from './components/main/random/Blocked';
import { container } from './components/styles'; // Your custom styles

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDsc6iMiPIzezGfFQv3U_LjKTTua2xcnRQ",
  authDomain: "village-77c9f.firebaseapp.com",
  databaseURL: "https://village-77c9f-default-rtdb.firebaseio.com",
  projectId: "village-77c9f",
  storageBucket: "village-77c9f.firebasestorage.app",
  messagingSenderId: "934742515805",
  appId: "1:934742515805:web:3cbf4d9925ae2fc6cdadb4",
  measurementId: "G-RBEMMXKH98",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Redux Store
const store = createStore(rootReducer, applyMiddleware(thunk));

// Suppress Specific Warnings
LogBox.ignoreLogs(['Setting a timer']);
// Store the original console.warn method
const originalWarn = console.warn;

// Override console.warn to filter out specific warnings
console.warn = (message, ...args) => {
  if (!message.includes('Setting a timer')) {
    originalWarn(message, ...args);
  }
};
// Navigation Stack
const Stack = createStackNavigator();

export class App extends Component {
  constructor(props) {
    super();
    this.state = {
      loggedIn: null,
      loaded: false,
    };
  }

  componentDidMount() {
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({ loggedIn: true, loaded: true });
      } else {
        this.setState({ loggedIn: false, loaded: true });
      }
    });
  }

  render() {
    const { loggedIn, loaded } = this.state;

    // Show Splash Screen while loading
    if (!loaded) {
      return <Image style={container.splash} source={require('./assets/logo.png')} />;
    }

    // If not logged in, show Login/Registration stack
    if (!loggedIn) {
      return (
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }

    // If logged in, show Main App stack
    return (
      <Provider store={store}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Main">
            <Stack.Screen
              name="Main"
              component={MainScreen}
              options={({ route }) => {
                const routeName = getFocusedRouteNameFromRoute(route) ?? 'Feed';
                switch (routeName) {
                  case 'Camera':
                    return { headerTitle: 'Camera' };
                  case 'Chat':
                    return { headerTitle: 'Chat' };
                  case 'Profile':
                    return { headerTitle: 'Profile' };
                  case 'Search':
                    return { headerTitle: 'Search' };
                  default:
                    return { headerTitle: 'Village' };
                }
              }}
            />
            <Stack.Screen name="Save" component={SaveScreen} />
            <Stack.Screen name="Post" component={PostScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="Edit" component={EditScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Comment" component={CommentScreen} />
            <Stack.Screen
              name="Blocked"
              component={BlockedScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </Provider>
    );
  }
}

export default App;
