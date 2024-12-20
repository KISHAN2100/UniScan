import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
  Share,
  Image,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useTheme } from '../context/ThemeContext';
import ImagePicker from 'react-native-image-crop-picker'; // Import the cropping library
import DocumentPicker, { types } from 'react-native-document-picker'; // Import DocumentPicker
import { WebView } from 'react-native-webview'; // Import WebView
import RNFS from 'react-native-fs'; // Import react-native-fs
import { Clipboard } from 'react-native';
import * as pdfjs from 'react-native-pdf';

interface HomeScreenProps {
  onNavigateToHistory?: () => void;
  onNavigateToTextDisplay: (
    text: string,
    uri: string,
    type: 'document' | 'camera' | 'image'
  ) => void;
}

interface CropPickerError {
  code: string;
  message: string;
}

// Type guard to check if error is CropPickerError
const isCropPickerError = (error: any): error is CropPickerError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToHistory,
  onNavigateToTextDisplay,
}) => {
  const { theme, toggleTheme } = useTheme();

  const [scannedText, setScannedText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');

  // For photo preview
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [croppedPhotoUri, setCroppedPhotoUri] = useState<string | null>(null); // New state for cropped image
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  // PDF Preview States
  const [isPdfModalVisible, setIsPdfModalVisible] = useState<boolean>(false);
  const [pdfHtmlContent, setPdfHtmlContent] = useState<string>('');

  // WebView Reference and Extraction State
  const webViewRef = useRef<WebView>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const [photoSettings, setPhotoSettings] = useState({
    flash: 'off',
    qualityPrioritization: 'quality',
    enableAutoStabilization: true,
    skipMetadata: false,
  })

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      if (cameraPermission === 'denied') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to scan documents.'
        );
      }
    })();
  }, []);

  // Function to call Google Vision API
  const callGoogleVisionAPI = async (imageUri: string) => {
    try {
      const API_KEY = 'AIzaSyBaT-vLkTzPHlt2sC2HH4DKD0_vuUwwJkw'; // Replace with your actual API Key
      const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

      // Ensure the imageUri starts with 'file://'
      if (!imageUri.startsWith('file://')) {
        imageUri = 'file://' + imageUri;
      }

      // Extract the file path without the 'file://' prefix
      const filePath = imageUri.replace('file://', '');

      // Check if the file exists
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        throw new Error('Image file does not exist at the specified path.');
      }

      // Read the image file as base64
      const imageBase64 = await RNFS.readFile(filePath, 'base64');

      // Prepare the API request body
      const requestBody = {
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      };

      // Call Google Vision API
      const googleResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!googleResponse.ok) {
        const errorResponse = await googleResponse.text();
        throw new Error(`Google Vision API Error: ${errorResponse}`);
      }

      const result = await googleResponse.json();

      // Debug: Log the entire response for troubleshooting
      console.log('Google Vision API Response:', JSON.stringify(result, null, 2));

      // Extract text from the response
      const textAnnotations = result.responses[0]?.textAnnotations;
      if (textAnnotations && textAnnotations.length > 0) {
        return textAnnotations[0].description; // Return extracted text
      } else {
        return 'No text detected.';
      }
    } catch (error) {
      console.error('Error calling Google Vision API:', error);
      return 'Error processing image.';
    }
  };

  const handlePDFUpload = async () => {
    try {
      console.log('handlePDFUpload: Starting PDF upload process.');

      // Determine the Android version
      const apiLevel = Platform.Version;

      // For Android versions below 13, request READ_EXTERNAL_STORAGE permission
      if (Platform.OS === 'android' && parseInt(apiLevel as string) < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to your storage to select PDFs.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Storage permission is required to select PDFs.'
          );
          console.log('handlePDFUpload: READ_EXTERNAL_STORAGE permission denied.');
          return;
        }
        console.log('handlePDFUpload: READ_EXTERNAL_STORAGE permission granted.');
      }

      // Open Document Picker to select a PDF
      const res = await DocumentPicker.pick({
        type: [types.pdf],
      });

      console.log('handlePDFUpload: Document picked successfully.', res);

      if (res && res[0]) {
        let fileUri = res[0].uri;

        console.log('Original File URI:', fileUri);

        // For Android, handle content:// URIs
        if (Platform.OS === 'android' && fileUri.startsWith('content://')) {
          console.log('handlePDFUpload: Handling content URI.');

          // Extract the file name
          const fileName = res[0].name || `temp_${Date.now()}.pdf`;

          // Define the destination path in the temporary directory
          const destPath = `${RNFS.TemporaryDirectoryPath}${fileName}`;

          console.log('Destination Path:', destPath);

          // Copy the file from content:// URI to the temporary directory
          // RNFS.copyFile requires file:// URI, so ensure destPath has file://
          const destUri = destPath.startsWith('file://') ? destPath : `file://${destPath}`;

          try {
            await RNFS.copyFile(fileUri, destPath);
            console.log('File copied successfully.');

            // Check if the file exists
            const fileExists = await RNFS.exists(destPath);
            console.log('Does the file exist?', fileExists);
            if (!fileExists) {
              Alert.alert('Error', 'The selected PDF file does not exist.');
              return;
            }

            // Update the fileUri to point to the copied file
            fileUri = destUri;
          } catch (copyError) {
            console.error('handlePDFUpload: Error copying file:', copyError);
            Alert.alert('Error', 'Failed to access the selected PDF file.');
            return;
          }
        } else if (Platform.OS === 'ios') {
          // For iOS, ensure the URI starts with file://
          if (!fileUri.startsWith('file://')) {
            fileUri = 'file://' + fileUri;
          }
        }

        console.log('Final File URI:', fileUri);

        // Check file existence
        const filePath = fileUri.replace('file://', '');
        const exists = await RNFS.exists(filePath);
        console.log('File exists:', exists);
        if (!exists) {
          Alert.alert('Error', 'The selected PDF file does not exist.');
          return;
        }

        // Read the PDF file as base64
        const base64PDF = await RNFS.readFile(filePath, 'base64');
        console.log('handlePDFUpload: PDF file read as base64.');

        // Create HTML content with PDF.js embedded and multi-page support
        const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body, html {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        background-color: ${theme === 'light' ? '#ffffff' : '#121212'};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      #pdf-viewer {
        flex: 1;
        width: 100%;
        overflow: auto;
      }
      #controls {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        padding: 10px;
        background-color: ${theme === 'light' ? '#f0f0f0' : '#1e1e1e'};
      }
      button {
        padding: 10px 20px;
        background-color: ${theme === 'light' ? '#3b82f6' : '#00ffea'};
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
      }
      #page-info {
        font-size: 16px;
        color: ${theme === 'light' ? '#1f2937' : '#ffffff'};
      }
      canvas {
        display: block;
        margin: 0 auto;
      }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.min.js"></script>
  </head>
  <body>
    <div id="pdf-viewer">
      <canvas id="pdf-canvas"></canvas>
    </div>
    <div id="controls">
      <button id="prev">Previous</button>
      <span id="page-info">Page 1 of 1</span>
      <button id="next">Next</button>
      <!-- Removed Extract Button from WebView -->
    </div>
    <script>
      console.log('WebView loaded');
      const url = 'data:application/pdf;base64,${base64PDF}';
      const canvas = document.getElementById('pdf-canvas');
      const ctx = canvas.getContext('2d');
      const prevButton = document.getElementById('prev');
      const nextButton = document.getElementById('next');
      const pageInfo = document.getElementById('page-info');

      let pdfDoc = null,
          pageNum = 1,
          pageIsRendering = false,
          pageNumIsPending = null;

      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';

      const renderPage = num => {
        console.log('Rendering page:', num);
        pageIsRendering = true;

        pdfDoc.getPage(num).then(page => {
          const scale = canvas.parentElement.clientWidth / page.getViewport({ scale: 0.9 }).width;
          const viewport = page.getViewport({ scale });
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderCtx = { canvasContext: ctx, viewport };

          page.render(renderCtx).promise.then(() => {
            console.log('Page rendered:', num);
            pageIsRendering = false;
            if (pageNumIsPending !== null) {
              renderPage(pageNumIsPending);
              pageNumIsPending = null;
            }
          }).catch(error => {
            console.error('Error during page rendering:', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Error rendering page.' }));
          });

          pageInfo.textContent = 'Page ' + num + ' of ' + pdfDoc.numPages;
        }).catch(error => {
          console.error('Error getting page:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Error getting page.' }));
        });
      };

      const queueRenderPage = num => {
        if (pageIsRendering) {
          pageNumIsPending = num;
        } else {
          renderPage(num);
        }
      };

      const showPrevPage = () => {
        if (pageNum <= 1) return;
        pageNum--;
        console.log('Navigating to previous page:', pageNum);
        queueRenderPage(pageNum);
      };

      const showNextPage = () => {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        console.log('Navigating to next page:', pageNum);
        queueRenderPage(pageNum);
      };

      // Handle messages from React Native
      window.addEventListener('message', function(event) {
        const message = event.data;
        console.log('Received message from React Native:', message);
        if (message === 'extractText') {
          console.log('Initiating text extraction...');
          extractTextFromPDF();
        }
      });

      // Enhance the extractTextFromPDF function
      const extractTextFromPDF = async () => {
        try {
          console.log('Starting PDF text extraction...');
          let fullText = '';
          
          if (!pdfDoc) {
            throw new Error('PDF document not loaded');
          }

          const totalPages = pdfDoc.numPages;
          console.log('Total pages:', totalPages);

          for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            console.log('Processing page:', pageNum);
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
              .map(item => item.str)
              .join(' ')
              .replace(/\\s+/g, ' ')
              .trim();

            fullText += pageText + '\\n\\n';
            console.log('Page', pageNum, 'processed');
          }

          console.log('Text extraction complete');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'extractedText',
            text: fullText.trim()
          }));
        } catch (error) {
          console.error('PDF extraction error:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: 'Failed to extract text from PDF: ' + error.message
          }));
        }
      };

      prevButton.addEventListener('click', showPrevPage);
      nextButton.addEventListener('click', showNextPage);
      // extractButton.addEventListener('click', () => {
      //   extractTextFromPDF();
      // }); // Removed Extract Button Event Listener

      pdfjsLib.getDocument(url).promise.then(pdfDoc_ => {
        pdfDoc = pdfDoc_;
        console.log('PDF loaded. Number of pages:', pdfDoc.numPages);
        pageInfo.textContent = 'Page ' + pageNum + ' of ' + pdfDoc.numPages;
        renderPage(pageNum);
      }).catch(error => {
        console.error('Error loading PDF:', error);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Error loading PDF.' }));
      });
    </script>
  </body>
</html>
`;

        // Set the HTML content for WebView
        setPdfHtmlContent(htmlContent);
        setIsPdfModalVisible(true);

        setIsProcessing(true);

        // Optional: If you want to perform OCR on the PDF, implement it here

        setIsProcessing(false);
      }
    } catch (err: any) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, no action needed
        console.log('handlePDFUpload: User cancelled PDF picker.');
      } else {
        console.error('handlePDFUpload: Unknown error:', err);
        Alert.alert('Error', 'An error occurred while selecting the PDF.');
      }
    }
  };

  const handleCameraScan = () => {
    setScannedText('');
    setCapturedPhotoUri(null);
    setCroppedPhotoUri(null); // Reset cropped photo URI
    setIsPreviewVisible(false);
    setIsScanning(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });
      const uri = photo.path.startsWith('file://')
        ? photo.path
        : 'file://' + photo.path;

      console.log('Captured Photo URI:', uri);

      // Store the photo URI and show the preview instead of a prompt
      setCapturedPhotoUri(uri);
      setIsPreviewVisible(true);
    } catch (err) {
      console.error('takePicture:', err);
      Alert.alert('Error', 'An error occurred while taking the picture.');
    }
  };

  // Function to handle cropping
  const handleCropPhoto = async () => {
    if (!capturedPhotoUri) return;

    try {
      const {width: screenWidth} = Dimensions.get('window');
      const croppedImage = await ImagePicker.openCropper({
        path: capturedPhotoUri,
        width: screenWidth * 0.9, // 80% of screen width
        height: screenWidth * 0.9 , // 80% of screen width
        cropping: true,
        cropperCircleOverlay: false, // Set to true if you want a circular crop
        includeBase64: false,
        mediaType: 'photo',
        compressImageQuality: 1,
        forceJpg: true,
      });

      console.log('Cropped Image Path:', croppedImage.path);

      setCroppedPhotoUri(croppedImage.path);
      setIsPreviewVisible(true); // Keep preview visible to show cropped image
    } catch (error: unknown) {
      if (isCropPickerError(error)) {
        if (error.code === 'E_PICKER_CANCELLED') {
          // User cancelled cropping
          console.log('handleCropPhoto: User cancelled cropping.');
          return;
        }
        // Handle other CropPicker errors
        Alert.alert('Error', error.message);
      } else {
        // Handle unexpected errors
        console.error('handleCropPhoto: Unexpected error cropping image:', error);
        Alert.alert(
          'Error',
          'An unexpected error occurred while cropping the photo.'
        );
      }
    }
  };

  // Confirm photo: run OCR and close camera
  const handleConfirmPhoto = async () => {
    const imageUri = croppedPhotoUri || capturedPhotoUri; // Use cropped image if available

    if (!imageUri) return;

    try {
      setIsProcessing(true);

      // Call Google Vision API to extract text
      const extractedText = await callGoogleVisionAPI(imageUri);

      console.log('Extracted Text:', extractedText);

      setScannedText(extractedText); // Display extracted text
      setIsScanning(false); // Hide camera modal
      setIsPreviewVisible(false); // Hide preview
      setCroppedPhotoUri(null); // Reset cropped photo URI
      setIsProcessing(false);

      Alert.alert('Success', 'Text scanned successfully!');
      onNavigateToTextDisplay(extractedText, imageUri, 'camera');
    } catch (err) {
      console.error('handleConfirmPhoto:', err);
      setIsProcessing(false);
      Alert.alert('Error', 'An error occurred while processing the image.');
    }
  };

  // Retake photo: clear the captured URI and stay in camera modal
  const handleRetakePhoto = () => {
    setCapturedPhotoUri(null);
    setCroppedPhotoUri(null); // Reset cropped photo URI
    setIsPreviewVisible(false);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: scannedText,
      });
    } catch (error) {
      console.log('handleShare: Error sharing text:', error);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(scannedText);
    Alert.alert('Copied', 'Scanned text has been copied to clipboard.');
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Text',
      'Are you sure you want to clear the scanned text?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => setScannedText(''),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        theme === 'light' ? styles.lightContainer : styles.darkContainer,
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          theme === 'light' ? styles.lightHeader : styles.darkHeader,
        ]}
      >
        <View style={styles.headerTextContainer}>
          <Text
            style={[
              styles.headerTitle,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            🚀 UniScan
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              theme === 'light' ? styles.lightSubtitle : styles.darkSubtitle,
            ]}
          >
            Next-Gen Document Scanner
          </Text>
        </View>
        {/* Theme Toggle Button */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={styles.themeToggle}
          accessibilityLabel="Toggle Theme"
        >
          <Text style={styles.themeToggleText}>
            {theme === 'light' ? '🌙' : '☀️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View
        style={[
          styles.quickActions,
          theme === 'light' ? styles.lightCard : styles.darkCard,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.actionButton,
            theme === 'light'
              ? styles.lightActionButton
              : styles.darkActionButton,
          ]}
          onPress={handleCameraScan}
          accessibilityLabel="Scan Document"
        >
          <Text style={styles.actionEmoji}>📷</Text>
          <Text
            style={[
              styles.actionButtonText,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            Scan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            theme === 'light'
              ? styles.lightActionButton
              : styles.darkActionButton,
          ]}
          onPress={handlePDFUpload}
          accessibilityLabel="Import PDF"
        >
          <Text style={styles.actionEmoji}>📁</Text>
          <Text
            style={[
              styles.actionButtonText,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            Import PDF
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scanned Text Display */}
      {scannedText !== '' ? (
        <View
          style={[
            styles.scannedTextContainer,
            theme === 'light' ? styles.lightCard : styles.darkCard,
          ]}
        >
          <Text
            style={[
              styles.scannedTextTitle,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            📝 Scanned Text:
          </Text>
          <ScrollView style={styles.textScroll}>
            <Text
              style={[
                styles.scannedText,
                theme === 'light' ? styles.lightText : styles.darkText,
              ]}
            >
              {scannedText}
            </Text>
          </ScrollView>
          <View style={styles.textActionContainer}>
            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.textActionButton,
                theme === 'light'
                  ? styles.lightActionButtonSecondary
                  : styles.darkActionButtonSecondary,
              ]}
              accessibilityLabel="Share Scanned Text"
            >
              <Text
                style={[
                  styles.textActionButtonText,
                  theme === 'light' ? styles.lightButtonText : styles.darkButtonText,
                ]}
              >
                🔗 Share
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCopy}
              style={[
                styles.textActionButton,
                theme === 'light'
                  ? styles.lightActionButtonSecondary
                  : styles.darkActionButtonSecondary,
              ]}
              accessibilityLabel="Copy Scanned Text"
            >
              <Text
                style={[
                  styles.textActionButtonText,
                  theme === 'light' ? styles.lightButtonText : styles.darkButtonText,
                ]}
              >
                📋 Copy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClear}
              style={[
                styles.textActionButton,
                theme === 'light'
                  ? styles.lightActionButtonSecondary
                  : styles.darkActionButtonSecondary,
              ]}
              accessibilityLabel="Clear Scanned Text"
            >
              <Text
                style={[
                  styles.textActionButtonText,
                  theme === 'light' ? styles.lightButtonText : styles.darkButtonText,
                ]}
              >
                🗑️ Clear
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.emptyStateContainer,
            theme === 'light' ? styles.lightCard : styles.darkCard,
          ]}
        >
          <Text
            style={[
              styles.emptyStateText,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            Start by scanning a document or importing a PDF to extract text.
          </Text>
        </View>
      )}

      {/* Camera Modal */}
      <Modal visible={isScanning} transparent={false} animationType="slide">
        <View
          style={[
            styles.cameraContainer,
            theme === 'light' ? styles.lightContainer : styles.darkContainer,
          ]}
        >
          {/* If we haven't captured a photo yet, show the camera. Otherwise, show preview */}
          {device && !capturedPhotoUri && (
            <Camera
              ref={cameraRef}
              style={styles.camera}
              device={device}
              isActive={true}
              photo={true}
            />
          )}

          {/* If a photo is captured, show a preview */}
          {capturedPhotoUri && isPreviewVisible && (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: croppedPhotoUri || capturedPhotoUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <View style={styles.previewButtonContainer}>
                {/* Show Crop button only if the photo hasn't been cropped yet */}
                {!croppedPhotoUri && (
                  <TouchableOpacity
                    onPress={handleCropPhoto}
                    style={[styles.previewButton, { backgroundColor: '#ffbb00' }]}
                  >
                    <Text style={styles.previewButtonText}>✂️ Crop</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleRetakePhoto}
                  style={[styles.previewButton, { backgroundColor: '#ff005e' }]}
                >
                  <Text style={styles.previewButtonText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmPhoto}
                  style={[styles.previewButton, { backgroundColor: '#00ffea' }]}
                >
                  <Text style={styles.previewButtonText}>Use Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Capture Button (only show if not previewing) */}
          {!capturedPhotoUri && (
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity
                onPress={takePicture}
                style={[
                  styles.captureButton,
                  theme === 'light'
                    ? styles.lightCaptureButton
                    : styles.darkCaptureButton,
                ]}
                accessibilityLabel="Capture Photo"
              >
                <Text
                  style={[
                    styles.captureButtonText,
                    theme === 'light'
                      ? styles.lightCaptureButtonText
                      : styles.darkCaptureButtonText,
                  ]}
                >
                  📸
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => {
              setIsScanning(false);
              setCapturedPhotoUri(null);
              setCroppedPhotoUri(null); // Reset cropped photo URI
              setIsPreviewVisible(false);
            }}
            style={styles.closeButton}
            accessibilityLabel="Close Camera"
          >
            <Text
              style={[
                styles.closeButtonText,
                theme === 'light'
                  ? styles.lightCloseButtonText
                  : styles.darkCloseButtonText,
              ]}
            >
              ❌
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* PDF Preview Modal */}
      <Modal
        visible={isPdfModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsPdfModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.container,
            theme === 'light' ? styles.lightContainer : styles.darkContainer,
          ]}
        >
          {/* Header for PDF Preview */}
          <View
            style={[
              styles.pdfHeader,
              theme === 'light' ? styles.lightCard : styles.darkCard,
            ]}
          >
            <Text
              style={[
                styles.pdfHeaderText,
                theme === 'light' ? styles.lightText : styles.darkText,
              ]}
            >
              📄 PDF Preview
            </Text>
            <TouchableOpacity
              onPress={() => setIsPdfModalVisible(false)}
              style={styles.closePdfButton}
              accessibilityLabel="Close PDF Preview"
            >
              <Text
                style={[
                  styles.closePdfButtonText,
                  theme === 'light'
                    ? styles.lightCloseButtonText
                    : styles.darkCloseButtonText,
                ]}
              >
                ❌
              </Text>
            </TouchableOpacity>
          </View>

          {/* WebView to display PDF */}
          {pdfHtmlContent ? (
            <WebView
              ref={webViewRef} // Assign the ref
              originWhitelist={['*']}
              source={{ html: pdfHtmlContent }}
              style={styles.pdf}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <ActivityIndicator
                  size="large"
                  color={theme === 'light' ? '#00ffea' : '#3b82f6'}
                  style={styles.webViewLoader}
                />
              )}
              onMessage={(event) => {
                try {
                  console.log('Received message from WebView:', event.nativeEvent.data); // Add debug logging
                  const messageData = JSON.parse(event.nativeEvent.data);
                  if (messageData.type === 'error') {
                    Alert.alert('Error', messageData.message);
                    setIsPdfModalVisible(false);
                  } else if (messageData.type === 'extractedText') {
                    const extractedText = messageData.text;
                    console.log('Extracted text length:', extractedText?.length); // Add debug logging
                    if (extractedText && extractedText.trim()) {
                      setIsExtracting(false);
                      setIsPdfModalVisible(false); // Close PDF modal
                      // Navigate to TextDisplay screen with the extracted text
                      onNavigateToTextDisplay(extractedText, '', 'document');
                    } else {
                      setIsExtracting(false);
                      Alert.alert('Error', 'No text could be extracted from the PDF.');
                    }
                  }
                } catch (error) {
                  console.error('Error processing WebView message:', error);
                  setIsExtracting(false);
                  Alert.alert('Error', 'Failed to process PDF text');
                }
              }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('handlePDFUpload: WebView error: ', nativeEvent);
                Alert.alert('Error', 'Failed to load PDF in WebView.');
              }}
              onLoadEnd={() => {
                console.log('handlePDFUpload: WebView load ended.');
              }}
            />
          ) : (
            <ActivityIndicator
              size="large"
              color={theme === 'light' ? '#00ffea' : '#3b82f6'}
              style={styles.webViewLoader}
            />
          )}

          {/* Extract Button */}
          <View style={styles.extractButtonContainer}>
            <TouchableOpacity
              onPress={() => {
                if (webViewRef.current) {
                  console.log('Initiating text extraction...'); // Add debug logging
                  setIsExtracting(true);
                  webViewRef.current.injectJavaScript(`
        try {
          console.log('Starting PDF text extraction...');
          extractTextFromPDF();
        } catch (error) {
          console.error('Error in extraction:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: 'Failed to extract text: ' + error.message
          }));
        }
        true;
      `);
                }
              }}
              style={[
                styles.extractButton,
                theme === 'light' ? styles.lightExtractButton : styles.darkExtractButton,
              ]}
              disabled={isExtracting}
            >
              <Text style={[styles.extractButtonText, theme === 'light' ? styles.lightButtonText : styles.darkButtonText]}>
                {isExtracting ? 'Extracting...' : '📄 Extract Text'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Processing Overlay for Extraction */}
          {isExtracting && (
            <View
              style={[
                styles.processingOverlay,
                theme === 'light'
                  ? styles.lightProcessingOverlay
                  : styles.darkProcessingOverlay,
              ]}
            >
              <ActivityIndicator
                size="large"
                color={theme === 'light' ? '#00ffea' : '#3b82f6'}
              />
              <Text
                style={[
                  styles.processingText,
                  theme === 'light' ? styles.lightText : styles.darkText,
                ]}
              >
                Extracting Text...
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Processing Overlay */}
      {isProcessing && (
        <View
          style={[
            styles.processingOverlay,
            theme === 'light'
              ? styles.lightProcessingOverlay
              : styles.darkProcessingOverlay,
          ]}
        >
          <ActivityIndicator
            size="large"
            color={theme === 'light' ? '#00ffea' : '#3b82f6'}
          />
          <Text
            style={[
              styles.processingText,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            Processing...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: '#121212', // Dark background
  },
  lightContainer: {
    backgroundColor: '#f0f4f7', // Light background
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkHeader: {
    backgroundColor: '#1e1e1e',
  },
  lightHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  darkText: {
    color: '#ffffff',
  },
  lightText: {
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  darkSubtitle: {
    color: '#9ca3af',
  },
  lightSubtitle: {
    color: '#6b7280',
  },
  themeToggle: {
    padding: 10,
    marginLeft: 10,
  },
  themeToggleText: {
    fontSize: 24,
  },
  quickActions: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#00ffea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  lightCard: {
    backgroundColor: '#ffffff',
  },
  actionButton: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    width: '45%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  darkActionButton: {
    backgroundColor: '#2c2c2c',
    borderWidth: 1,
    borderColor: '#00ffea',
  },
  lightActionButton: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  actionEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scannedTextContainer: {
    flex: 1,
    padding: 25,
    margin: 20,
    borderRadius: 20,
    shadowColor: '#00ffea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  scannedTextTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
  },
  scannedText: {
    fontSize: 16,
    lineHeight: 24,
  },
  textScroll: {
    maxHeight: 250,
    marginBottom: 20,
  },
  textActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  textActionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  darkActionButtonSecondary: {
    backgroundColor: '#00ffea',
  },
  lightActionButtonSecondary: {
    backgroundColor: '#3b82f6',
  },
  textActionButtonText: {
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 16,
  },
  darkButtonText: {
    color: '#1e1e1e',
  },
  lightButtonText: {
    color: '#ffffff',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 18,
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
  captureButton: {
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  darkCaptureButton: {
    backgroundColor: '#00ffea',
  },
  lightCaptureButton: {
    backgroundColor: '#3b82f6',
  },
  captureButtonText: {
    fontSize: 28,
  },
  darkCaptureButtonText: {
    color: '#1e1e1e',
  },
  lightCaptureButtonText: {
    color: '#ffffff',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 25,
  },
  closeButtonText: {
    fontSize: 30,
  },
  darkCloseButtonText: {
    color: '#ff005e', // Neon red for dark mode
  },
  lightCloseButtonText: {
    color: '#ff005e', // Neon red works on light background as well
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkProcessingOverlay: {
    backgroundColor: 'rgba(0, 255, 234, 0.8)',
  },
  lightProcessingOverlay: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  processingText: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '700',
  },

  // Preview styles
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  previewButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  previewButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  previewButtonText: {
    color: '#1e1e1e',
    fontWeight: '700',
    fontSize: 16,
  },

  // PDF Preview Styles
  pdfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff', // Adjust based on theme if needed
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pdfHeaderText: {
    fontSize: 24,
    fontWeight: '700',
  },
  closePdfButton: {
    padding: 10,
  },
  closePdfButtonText: {
    fontSize: 24,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webViewLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // New Styles for Extract Button
  extractButtonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  extractButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  lightExtractButton: {
    backgroundColor: '#3b82f6',
  },
  darkExtractButton: {
    backgroundColor: '#00ffea',
  },
  extractButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default HomeScreen;
