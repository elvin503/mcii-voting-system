import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import * as faceapi from 'face-api.js';

import './App.css';

function App() {
  const [view, setView] = useState('main');
  const [password, setPassword] = useState('');
  const [studentID, setStudentID] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [courseYear, setCourseYear] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [votes, setVotes] = useState({});
  const [selectedVotes, setSelectedVotes] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasVotedById, setHasVotedById] = useState({});
  const [capturedIDPhoto, setCapturedIDPhoto] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [course, setCourse] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [faceCameraStream, setFaceCameraStream] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isIDConfirmed, setIsIDConfirmed] = useState(false);
  const [isFaceConfirmed, setIsFaceConfirmed] = useState(false);
  const [idFaceDescriptor, setIdFaceDescriptor] = useState(null);
  const [idImage, setIdImage] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [idFacePreview, setIdFacePreview] = useState(null);
  const [showFaceVerifiedPopup, setShowFaceVerifiedPopup] = useState(false);
  const [voterAccounts, setVoterAccounts] = useState({});
  const [partylist, setPartylist] = useState('');
  const [partylistColor, setPartylistColor] = useState('#000000');
  const [editingPosition, setEditingPosition] = useState(null);
  const [receiptData, setReceiptData] = useState([]);
  const [isIDAlreadySignedIn, setIsIDAlreadySignedIn] = useState(false);
  const [selectedPartylist, setSelectedPartylist] = useState('');
  const [lastStraightVote, setLastStraightVote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dots, setDots] = useState("");
  

  const [stepsDone, setStepsDone] = useState({
    step1: false,  // Step 1 not done initially
    step2: false,  // Step 2 depends on Step 1
    step3: false   // Step 3 depends on Step 2
  });
  const [eyeBlinkDetected, setEyeBlinkDetected] = useState(false);
  const eyeClosedFramesRef = useRef(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);


  

  
  

  
  
  

  

  

  
  
  
  



  const [recordedVotes, setRecordedVotes] = useState({
    votesCount: {},      // Tracks vote counts
    voteRecords: []      // Tracks who voted and their selections
  });
  const [studentName, setStudentName] = useState('');
  const validVoters = {
    
  };

  const positions = [
    "President", "Vice President", "Secretary", "Auditor",
    "Treasurer", "PIO", "BSCS Represent.", "BEED Represent.","BSHM Represent.",
    "Crim. Represent.", "Pharma. Represent.", "Midwifery Represent."
  ];
  const videoRef = useRef(null);
  const canvasRef = useRef();
  const faceDetectionInterval = useRef(null);

  const resetFormForNextUser = () => {
    setFirstName('');
    setMiddleInitial('');
    setLastName('');
    setCourse('');
    setYearLevel('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordError('');
    setIsIDConfirmed(false);
    setIsFaceConfirmed(false);
    setStudentID('');
  };
  

  
  
  
    // get unique partylist from existing candidates
  const availablePartylists = [...new Set(candidates.map(c => c.partylist))];


  const handleAddCandidate = () => {
  const newCandidates = [];

  positions.forEach((pos) => {
    // Add two candidates per position with unique random avatars
    const randomAvatar1 = `https://i.pravatar.cc/200?u=${pos}-1-${Date.now()}-${Math.random()}`;
    const randomAvatar2 = `https://i.pravatar.cc/200?u=${pos}-2-${Date.now()}-${Math.random()}`;

    newCandidates.push({
      position: pos,
      name: `${pos} Candidate 1`,
      courseYear: "BSCS 4",
      partylist: "Blue Partylist",
      partylistColor: "#0000FF",
      photo: randomAvatar1
    });

    newCandidates.push({
      position: pos,
      name: `${pos} Candidate 2`,
      courseYear: "BSCS 4",
      partylist: "Red Partylist",
      partylistColor: "#FF0000",
      photo: randomAvatar2
    });
  });

  setCandidates((prev) => [...prev, ...newCandidates]);

  alert("✅ 2 candidates added per position with unique profile pictures!");
  if (!selectedPosition || !candidateName || !courseYear) {
    alert("⚠️ Please fill in Position, Candidate Name, and Course/Year");
    return;
  }

  const newCandidate = {
    position: selectedPosition,
    name: candidateName,
    courseYear: courseYear,
    partylist: partylist || '',       // optional
    partylistColor: partylistColor || '#000', // default black
    photo: photo || null
  };

  setCandidates(prev => [...prev, newCandidate]);

  // Reset form
  setSelectedPosition('');
  setCandidateName('');
  setCourseYear('');
  setPartylist('');
  setPartylistColor('#000');
  setPhoto(null);
  setEditingIndex(null);

};


const StepButton = ({ stepKey, stepLabel, title, enabled, stepsDone, setStepsDone }) => {
  const done = stepsDone[stepKey]; // Is this step done?

  // Check if previous step is done
  const isPreviousStepDone = (key) => {
    if (key === 'step1') return true; // Step 1 has no previous
    if (key === 'step2') return stepsDone.step1;
    if (key === 'step3') return stepsDone.step2;
    return false;
  };

  const prevDone = isPreviousStepDone(stepKey);

  return (
    <button
      type="button"
      disabled={!enabled || done || !prevDone} // disable if previous step not done
      onClick={() => setStepsDone(prev => ({ ...prev, [stepKey]: true }))}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: done ? 'none' : '1px solid rgba(0,0,0,0.30)',
        borderRadius: '6px',
        padding: '6px 10px',
        textAlign: 'left',
        cursor: done || !enabled || !prevDone ? 'default' : 'pointer',
        boxShadow: done ? 'none' : '0 1px 3px rgba(0,0,0,0.20)',
        pointerEvents: done || !enabled || !prevDone ? 'none' : 'auto',
        opacity: prevDone ? 1 : 0.5, // faded if previous step not done
        filter: prevDone ? 'none' : 'blur(1px)', // slight blur effect
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ color: '#a5b9aa' }}>{stepLabel}</div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '15px',
          fontWeight: 'bold',
          color: done ? 'green' : '#4a90e2'
        }}
      >
        {title}
        {done ? (
          <span>✅</span>
        ) : prevDone ? (
          <div className="spinner" /> // show spinner only if previous step done
        ) : null}
      </div>
    </button>
  );
};




  
  
const handleEditCandidate = (index, position) => {
  const positionCandidates = candidates.filter(c => c.position === position);
  const candidate = positionCandidates[index];

  // Find the correct index in the main candidates array
  const mainIndex = candidates.findIndex(
    c => c.position === candidate.position && c.name === candidate.name
  );

  setSelectedPosition(candidate.position);
  setCandidateName(candidate.name);
  setCourseYear(candidate.courseYear);
  setPartylist(candidate.partylist || '');
  setPartylistColor(candidate.partylistColor || '#000000');
  setPhoto(candidate.photo || null);

  setEditingIndex(mainIndex);
  setEditingPosition(candidate.position);
};

  
  const handleDeleteCandidate = (candidateToDelete) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
  
    setCandidates(prev =>
      prev.filter(c => c !== candidateToDelete)
    );
  };
  
  
  const getEAR = (eye) => {
    const A = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
    const B = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
    const C = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
    return (A + B) / (2.0 * C);
  };
  

  const detectEyeBlink = async () => {
    if (!modelsLoaded) return;
    if (!videoRef.current) return;
    if (eyeBlinkDetected) return;
  
    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224 })
      )
      .withFaceLandmarks(true); // 👈 IMPORTANT
  
    if (!detection) return;
  
    const leftEye = detection.landmarks.getLeftEye();
    const rightEye = detection.landmarks.getRightEye();
  
    // get eye height (top-bottom)
    const leftEyeHeight = Math.abs(leftEye[1].y - leftEye[5].y);
    const rightEyeHeight = Math.abs(rightEye[1].y - rightEye[5].y);
  
    const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
  
    // 👁️ VERY SIMPLE BLINK RULE
    if (avgEyeHeight < 1) {
      setEyeBlinkDetected(true); // ✅ BLINK!
    }
  };
  
  

  
  const toggleVoterExpand = (index) => {
    setExpandedVoters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const [expandedVoters, setExpandedVoters] = useState({});
  const handleDeleteVoter = (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this voter's record?");
    if (confirmDelete) {
      const newRecords = [...recordedVotes.voteRecords];
      const removedRecord = newRecords.splice(index, 1)[0];
  
      const updatedVotesCount = { ...recordedVotes.votesCount };
  
      Object.entries(removedRecord.votes).forEach(([position, candidateName]) => {
        const key = `${position}_${candidateName}`;
        if (updatedVotesCount[key] > 0) {
          updatedVotesCount[key] -= 1;
          if (updatedVotesCount[key] === 0) {
            delete updatedVotesCount[key];
          }
        }
      });
  
      // 1️⃣ Remove from hasVotedById
      const updatedHasVoted = { ...hasVotedById };
      Object.keys(updatedHasVoted).forEach(id => {
        if (removedRecord.name === voterAccounts[id]?.name) {
          delete updatedHasVoted[id]; // Allow re-voting
        }
      });
  
      // 2️⃣ Remove voter account so they can log in / register again
      setVoterAccounts(prev => {
        const newAccounts = { ...prev };
        Object.keys(prev).forEach(id => {
          if (prev[id].name === removedRecord.name) {
            delete newAccounts[id];
          }
        });
        return newAccounts;
      });
  
      // 3️⃣ Update state
      setRecordedVotes({
        votesCount: updatedVotesCount,
        voteRecords: newRecords
      });
  
      setHasVotedById(updatedHasVoted);
      setHasSubmitted(false);
    }
  };
  
  
  async function detectFaceFromID(imageElement) {
    const detections = await faceapi.detectSingleFace(imageElement).withFaceLandmarks().withFaceDescriptor();
  
    if (detections) {
      const box = detections.detection.box;
      const canvas = document.createElement("canvas");
      canvas.width = box.width;
      canvas.height = box.height;
  
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        imageElement,
        box.x,
        box.y,
        box.width,
        box.height,
        0,
        0,
        box.width,
        box.height
      );
  
      const faceImageURL = canvas.toDataURL();
      setIdFacePreview(faceImageURL); // save the face preview in state
    }
  }
  
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  
  
  const resetForm = () => {
    setCandidateName('');
    setCourseYear('');
    setPhoto(null);
    setPhotoPreview(null);
    setSelectedPosition('');
    setEditingIndex(null);
  };
  const handleAdminClick = () => {
    setIsLoading(true);          // Show loading
    setTimeout(() => {
      setIsLoading(false);       // Hide loading
      setView('password');       // Navigate to password screen
    }, 1000); // 2 seconds
  };
  
  const handleVoterClick = () => {
    setIsLoading(true);          // Show loading
    setTimeout(() => {
      setIsLoading(false);       // Hide loading
      setView('voterInput');       // Navigate to 
    }, 1000); // 2 seconds
  };

  const handleBackClick = () => {
    setIsLoading(true);
    setTimeout(() => {
    setIsLoading(false);
    setView('main');
    setPassword('');
    setStudentID('');
    resetForm();
  }, 1000);
  };
  const handleEnterClick = () => {
    if (view === 'password') {
      if (password === 'admin') {
        setIsLoading(true);
        setTimeout(() => {
        setIsLoading(false);       // Hide loading
        setView('adminMenu');       // Navigate to  screen
        }, 1000); // 1 second
        
      } else {
        alert('🔐 Incorrect password!');
      }
    } else if (view === 'voterInput') {
      if (validVoters[studentID]) {
        setStudentName(validVoters[studentID]);
        setSelectedVotes({});
        setHasSubmitted(false);
        setView('voterWelcome');
      } else {
        alert('❌ Invalid Student ID!');
      }
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + "." : ""));
    }, 500);
  
    return () => clearInterval(interval); // cleanup on unmount
  }, []);
  

  
  useEffect(() => {
    if (
      view === 'faceVerificationView' &&
      !isFaceConfirmed &&
      !stepsDone[`step${currentStep}`]
    ) {
      startFaceCamera();
    }
  
    return () => clearInterval(faceDetectionInterval.current);
  }, [view, currentStep, isFaceConfirmed]);

  
  useEffect(() => {
    if (view === 'faceVerificationView') {
      setCurrentStep(1);
      setStepsDone({ step1: false, step2: false, step3: false });
      setIsFaceConfirmed(false);
    }
  }, [view]);
  
  
  
  
  const startFaceCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
  
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  
      faceDetectionInterval.current = setInterval(async () => {
        if (!videoRef.current) return;
  
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );
  
        if (detection && detection.score >= 0.95) {
          clearInterval(faceDetectionInterval.current);
          stopCamera();
  
          // ✅ AUTO COMPLETE CURRENT STEP
          setStepsDone(prev => ({
            ...prev,
            [`step${currentStep}`]: true
          }));
  
          // ✅ MOVE TO NEXT STEP
          if (currentStep < 3) {
            setCurrentStep(prev => prev + 1);
          } else {
            setIsFaceConfirmed(true);
            setShowFaceVerifiedPopup(true);
          }
        }
      }, 400);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };
  


  useEffect(() => {
    if (eyeBlinkDetected && !stepsDone.step1) {
      setStepsDone(prev => ({ ...prev, step1: true }));
    }
  }, [eyeBlinkDetected]);
  
  
  useEffect(() => {
    if (view === "voterInput") {  // "voterInput" is your sign-in screen
      setStudentID("");            // Clear old input
      setIsIDAlreadySignedIn(false); // Remove red warning
    }
  }, [view]);
  
  
  
  useEffect(() => {
  let stream;
  let animationId;
  let isRunning = true;
  let lastDetection = 0;

  const setupCameraAndDetect = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.error('Camera error:', err);
      return;
    }

    const detect = async () => {
      if (!isRunning || !idFaceDescriptor) return;

      const now = Date.now();
      if (now - lastDetection < 300) {
        animationId = requestAnimationFrame(detect);
        return;
      }

      const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (result) {
        const distance = faceapi.euclideanDistance(result.descriptor, idFaceDescriptor);
        console.log("Distance:", distance);

        if (distance < 0.45) {
          setIsFaceConfirmed(true);
          isRunning = false;
          video.srcObject.getTracks().forEach((t) => t.stop());
        }
      }

      lastDetection = now;
      if (isRunning) {
        animationId = requestAnimationFrame(detect);
      }
    };

    detect();
  };

  if (view === 'faceVerificationView') {
    setupCameraAndDetect();
  }

  return () => {
    isRunning = false;
    cancelAnimationFrame(animationId);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
  };
}, [view, idFaceDescriptor]);

useEffect(() => {
  const loadModels = async () => {
    const MODEL_URL = '/models'; // adjust path if needed
    
    await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
    await faceapi.loadFaceLandmarkTinyModel(MODEL_URL);
    await faceapi.loadFaceRecognitionModel(MODEL_URL);

    setModelsLoaded(true); // ✅ IMPORTANT
  };
  loadModels();
}, []);

useEffect(() => {
  if (view === 'takeIdPictureView') {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      const video = document.querySelector('video');
      if (video) {
        video.srcObject = stream;
        setCameraStream(stream);
      }
    });
  }
}, [view]);



  
const capturePhoto = () => {
  const video = document.querySelector('video');
  const canvas = document.createElement('canvas');

  if (video) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);  // mirror horizontally
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedIDPhoto(imageDataUrl);  // Save image
    confirmIDFromImage(imageDataUrl);  // Confirm ID

    // Optionally stop camera
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  } else {
    alert("📸 Camera not ready");
  }
};


  const preprocessImage = (imageDataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageDataUrl;
  
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
  
        // Draw image
        ctx.drawImage(img, 0, 0);
  
        // Grayscale filter
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);
  
        resolve(canvas.toDataURL('image/png'));
      };
    });
  };
  
  const confirmIDFromImage = async (imageDataUrl) => {
    try {
      setIsOcrLoading(true); // Show spinner
  
      const processedImage = await preprocessImage(imageDataUrl);
  
      Tesseract.recognize(
        processedImage,
        'eng',
        {
          logger: m => console.log(m),
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:-.',
          tessedit_pageseg_mode: 6,
          preserve_interword_spaces: 1,
        }
      ).then(({ data }) => {
        const rawText = data.text.toUpperCase();
        setOcrText(rawText);
  
        const text = rawText.replace(/[\s\n\r]+/g, ' ').replace(/[.,]/g, '').trim();
  
        const hasMedina = text.includes("MEDINA");
        const hasCollege = text.includes("COLLEGE");
        const hasIpil = text.includes("IPIL");
        const hasInc = text.includes("INC");
  
        const isValid = hasMedina && hasCollege && hasIpil && hasInc;
  
        if (isValid) {
          alert("✅ ID Confirmed.");
          setIsIDConfirmed(true); // 🔥 mark ID confirmed
        } else {
          alert("❌ ID not recognized. Please retake your ID photo clearly.");
        }
        
      }).finally(() => {
        setIsOcrLoading(false); // Hide spinner
      });
    } catch (err) {
      console.error("OCR Error:", err);
      alert("⚠️ Error processing image.");
      setIsOcrLoading(false); // Hide spinner on error
    }
  };
  
  const handleAddDefaultCandidates = () => {
    if (!selectedPosition) {
      alert("⚠️ Please select a position first.");
      return;
    }
  
    const defaultCandidates = [
      {
        position: selectedPosition,
        name: "Candidate 1",
        courseYear: "BSCS 4",
        partylist: "Blue Partylist",
        partylistColor: "#0000FF",
        photo: `https://i.pravatar.cc/200?u=${selectedPosition}-blue` // unique placeholder
      },
      {
        position: selectedPosition,
        name: "Candidate 2",
        courseYear: "BSCS 4",
        partylist: "Red Partylist",
        partylistColor: "#FF0000",
        photo: `https://i.pravatar.cc/200?u=${selectedPosition}-red` // unique placeholder
      }
    ];
  
    setCandidates(prev => [...prev, ...defaultCandidates]);
    setSelectedPosition('');
  };
  
  
  
  
  const handleBackFromCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCapturedIDPhoto(null);
    setCameraStream(null);
    setView('verificationStep');
  };
   
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const handleSubmitCandidate = () => {
    if (!candidateName || !courseYear || !selectedPosition) {
      alert("⚠️ Please fill in all fields.");
      return;
    }
    const newCandidate = {
      position: selectedPosition,
      name: candidateName,
      courseYear,
      photo: photoPreview,
    };
    if (editingIndex !== null) {
      const updated = [...candidates];
      updated[editingIndex] = newCandidate;
      setCandidates(updated);
      alert('✏️ Candidate updated!');
    } else {
      setCandidates([...candidates, newCandidate]);
      alert('✅ Candidate added!');
    }
    resetForm();
    setView('viewAndAddCandidate');
  };
  const handleEdit = (index) => {
    const candidate = candidates[index];
    setCandidateName(candidate.name);
    setCourseYear(candidate.courseYear);
    setSelectedPosition(candidate.position);
    setPhotoPreview(candidate.photo);
    setEditingIndex(index);
    setView('viewAndAddCandidate');
  };
  const handleDelete = (index) => {
    if (window.confirm("❗ Are you sure you want to delete this candidate?")) {
      const updated = [...candidates];
      updated.splice(index, 1);
      setCandidates(updated);
    }
  };
  const handleSubmitVotes = () => {
    if (Object.keys(selectedVotes).length === 0) return;
  
    const newVotesCount = { ...recordedVotes.votesCount };
    const voterRecord = { name: studentName, votes: {} };
    const receipt = [];
  
    positions.forEach(position => {
      const selIdx = selectedVotes[position];
      const relatedCandidates = candidates.filter(c => c.position === position);
  
      if (selIdx !== undefined && relatedCandidates[selIdx]) {
        const candidate = relatedCandidates[selIdx];
        const key = `${position}_${candidate.name}`;
        newVotesCount[key] = (newVotesCount[key] || 0) + 1;
  
        voterRecord.votes[position] = candidate.name;
        receipt.push({ position, candidate: candidate.name });
      } else {
        voterRecord.votes[position] = "No selection";
        receipt.push({ position, candidate: "No selection" });
      }
    });
  
    setRecordedVotes(prev => ({
      votesCount: newVotesCount,
      voteRecords: [...prev.voteRecords, voterRecord]
    }));
  
    setHasVotedById(prev => ({ ...prev, [studentID]: true }));
  
    setReceiptData(receipt);
    setSelectedVotes({});
    setHasSubmitted(true);
    setView("voteReceipt");
  };
  
  
  
  
  
      
  const [searchTerm, setSearchTerm] = useState('');
  
const handleDownloadCSV = () => {
  const csv = [
    ["Voter Name", "Position", "Candidate"],
    ...recordedVotes.voteRecords.flatMap(r =>
      Object.entries(r.votes).map(([pos, name]) => [r.name, pos, name])
    )
  ];
  const blob = new Blob([csv.map(row => row.join(',')).join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'voting_records.csv';
  link.click();
};

const handleDownloadPDF = () => {
  const win = window.open('', '_blank');
  if (win) {
    win.document.write('<html><head><title>Voting Records</title></head><body>');
    win.document.write('<h1>MCII Voting Results</h1>');
    recordedVotes.voteRecords.forEach(r => {
      win.document.write(`<p><strong>${r.name}</strong> voted:</p><ul>`);
      Object.entries(r.votes).forEach(([pos, name]) => {
        win.document.write(`<li><strong>${pos}</strong>: ${name}</li>`);
      });
      win.document.write('</ul>');
    });
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  }
};

// Download printable receipt (opens a new window + print)
const downloadReceiptPDF = () => {
  if (!receiptData || receiptData.length === 0) {
    alert("No receipt to download.");
    return;
  }

  const win = window.open('', '_blank');
  if (!win) return;

  const html = `
    <html>
      <head>
        <title>MCII Voting Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { text-align: center; }
          .row { margin: 12px 0; }
          .position { font-weight: bold; }
          .candidate { margin-left: 8px; }
          .footer { margin-top: 24px; font-size: 12px; color: #666; text-align:center; }
        </style>
      </head>
      <body>
        <h1>MCII Voting Receipt</h1>
        <p><strong>Voter:</strong> ${studentName || 'Unknown'}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <hr/>
        ${receiptData.map(r => `<div class="row"><span class="position">${r.position}:</span><span class="candidate">${r.candidate}</span></div>`).join('')}
        <hr/>
        <div class="footer">This is an official voting receipt. Selections are final.</div>
      </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
  // Give it a moment to render then trigger print (user can choose Save as PDF)
  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
};

// Simple download as TXT (fallback)
const downloadReceiptTxt = () => {
  if (!receiptData || receiptData.length === 0) {
    alert("No receipt to download.");
    return;
  }
  let text = `MCII Voting Receipt\nVoter: ${studentName || 'Unknown'}\nDate: ${new Date().toLocaleString()}\n\n`;
  receiptData.forEach(r => {
    text += `${r.position}: ${r.candidate}\n`;
  });
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'voting_receipt.txt';
  a.click();
  URL.revokeObjectURL(url);
};

// Logout and reset voter-related states
const handleLogout = () => {
  // You might want to keep admin or global candidates intact; just clear voter session
  setStudentName('');
  setStudentID('');
  setSelectedVotes({});
  setHasSubmitted(false);
  setIsIDConfirmed(false);
  setIsFaceConfirmed(false);
  setPasswordInput('');
  setConfirmPasswordInput('');
  setPasswordError('');
  setReceiptData([]);
  setView('main'); // go to main screen
};


  return (
    <div className="container">
      <div className="animated-square"></div>
      {view === 'main' && (
        <div className="content">
          <div className="logo-wrapper">
  <img src="/5.png" alt="MCII Logo" className="logo" />

  <div className="vote-reminder-vertical">
    <div className="open-text"> Voting is now open! 10/15/2025</div>
    <div className="end-text">⏰ Voting ends: 6:00 PM today</div>
  </div>
</div>

<h1
  className="title"
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px'
  }}
>
  <span
    onClick={handleAdminClick}
    style={{
      cursor: 'pointer',
      userSelect: 'none'
    }}
    title="Admin"
  >
    🗳️
  </span>
  MCII VOTING SYSTEM
</h1>

          <button className="main-button" onClick={handleVoterClick}>🙋 VOTER</button>
        </div>
      )}

      

      {view === 'takeIdPictureView' && (
  <div className="content camera-view">
    <h2 className="title">📸 Take ID Picture</h2>

    {!capturedIDPhoto ? (
  <>
    <video
  ref={videoRef}
  autoPlay
  muted
  playsInline
  style={{
    width: '100%',
    maxWidth: '400px',
    borderRadius: '10px',
    transform: 'scaleX(-1)'  // ← Flips horizontally
  }}
/>


    <button className="main-button" onClick={capturePhoto}>📷 Capture</button>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const image = reader.result;
            setCapturedIDPhoto(image);
            confirmIDFromImage(image);
          };
          reader.readAsDataURL(file);
          if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
          }
        }
      }}
      style={{ display: 'none' }}
      id="upload-id-pic"
    />
    <label htmlFor="upload-id-pic" className="main-button" style={{ marginTop: '10px' }}>
      📤 Upload ID Pic
    </label>
  </>
) : (
  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
    {/* Left: ID image */}
    <div style={{ maxWidth: '45%' }}>
      <img
        src={capturedIDPhoto}
        alt="Captured ID"
        style={{ width: '100%', borderRadius: '10px' }}
      />
      <p> ID Photo Captured</p>
    </div>


  </div>
)}


    <button className="custom-button" onClick={handleBackFromCamera}>⬅️ Back</button>
  </div>
)}

{view === 'takeIdPictureInstruction' && (
  <div
    style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      overflow: 'hidden',
      background: '#f0f0f0' // optional base background
    }}
  >
    {/* Blurred Sign-In Form background */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        filter: 'blur(8px) brightness(0.7)',
        zIndex: 1,
        pointerEvents: 'none', // unclickable
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      
    </div>

    {/* Instruction Box */}
    <div
      style={{
        position: 'relative',
        zIndex: 2,
        background: 'rgba(255,255,255,0.95)',
        padding: '25px 30px',
        borderRadius: '16px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        animation: 'fadeSlideUp 0.6s ease forwards',
        opacity: 0
      }}
    >
      <h2 className="title" style={{ textAlign: 'center' }}>
        📝 Before Taking Your Face Verification
      </h2>

      <p
        style={{
          maxWidth: 700,
          margin: '8px auto 16px',
          color: '#333',
          textAlign: 'center'
        }}
      >
        Note: this is to ensure you are the owner of your Student ID and avoid identity theft — please follow the steps below carefully.
      </p>

      <div style={{ textAlign: 'left', lineHeight: 1.6 }}>
        <ol style={{ paddingLeft: '18px' }}>
          <li>🧑‍🎓 <strong>Remove eyeglasses, caps, or face coverings</strong> so your full face is visible.</li>
          <li>💡 <strong>Stand in good lighting</strong> (face the light source; avoid strong backlight).</li>
          <li>👁️ <strong>Be ready to blink or open your mouth</strong> if prompted — this proves the photo is live.</li>
        </ol>
      </div>

      <div
        style={{
          marginTop: '25px',
          display: 'flex',
          justifyContent: 'center',
          gap: '12px'
        }}
      >
        <button
          className="main-button"
          onClick={() => setView('faceVerificationView')}
        >
          📸 Start Taking Face Verification
        </button>

        <button
          className="custom-button"
          onClick={() => setView('verificationStep')}
        >
          🔙 Back
        </button>
      </div>
    </div>

    <style>
      {`
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}
    </style>
  </div>
)}






{view === 'faceVerificationView' && (
  <div className="content camera-view" style={{ position: 'relative' }}>
    <h2 className="title">👁️ Face Verification</h2>

    {!isFaceConfirmed && (
      <h3 className="scanning-text" style={{ color: '#007bff' }}>
        Scanning<span>{dots}</span>
      </h3>
    )}

    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Camera Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          maxWidth: '400px',
          transform: 'scaleX(-1)', // Mirror view
          borderRadius: '10px',
          border: '2px solid blue',
          display: 'block'
        }}
      />
      

      {/* Step Text - absolutely positioned to the right */}
      <div
      style={{
        position: 'absolute',
        top: '0',       // start from top of the video
        left: '105%',   // right side of the video
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',     // space between steps
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#a5b9aa',
        textAlign: 'left',  // align text to left
        whiteSpace: 'nowrap'
      }}
  > 
    {/* STEP 1 BUTTON */}
    <StepButton
  stepKey="step1"
  stepLabel="Step 1"
  title="Eye Blink Verification"
  enabled={true}
  stepsDone={stepsDone}
  setStepsDone={setStepsDone}
/>

<StepButton
  stepKey="step2"
  stepLabel="Step 2"
  title="Open Mouth Verification"
  enabled={true}
  stepsDone={stepsDone}
  setStepsDone={setStepsDone}
/>

<StepButton
  stepKey="step3"
  stepLabel="Step 3"
  title="Face Verification"
  enabled={true}
  stepsDone={stepsDone}
  setStepsDone={setStepsDone}
/>

  </div>

  <style>
{`
  .spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(5, 15, 100, 0.2);   /* lighter background part */
    border-top: 2px solid #007bff;        /* blue spinning part */
    border-radius: 50%;
    animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`}
</style>


    </div>
    


    {showFaceVerifiedPopup && (
      <div className="popup">
        <h3 style={{ color: 'green' }}>😎✅ Face Verified!</h3>
        <button
          className="main-button"
          onClick={() => {
            setStepsDone({ step1: false, step2: false, step3: false });
            setShowFaceVerifiedPopup(false);
            stopCamera();
            setView('verificationStep'); // Go back to sign-in
          }}
        >
          OK
        </button>
      </div>
    )}

    <button
      className="custom-button"
      onClick={() => {
        setStepsDone({ step1: false, step2: false, step3: false });
        clearInterval(faceDetectionInterval.current);
        stopCamera();
        setView('verificationStep');
      }}
    >
      ⬅️ Back
    </button>
  </div>
)}



{isLoading && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  }}>
    <div style={{
      width: '100px',
      height: '100px',
      border: '8px solid #f3f3f3',
      borderTop: '8px solid #007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
  </div>
)}


      
      {view === 'password' && (
        <div className="content">
          <h2>🔐 Enter Password</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'inline-block' }}
          />
          </div>
          <button className="main-button" onClick={handleEnterClick}>Enter</button>
          <button className="custom-button" onClick={handleBackClick}>🡰 Back</button>
        </div>
      )}
      {view === 'voterInput' && (
  <div className="login-section">
    <h2 className="title">🔐 Voter Security</h2>

    {!showLoginForm ? (
      <>
        <button
          className="main-button"
          onClick={() => setShowLoginForm(true)}
        >
          Login
        </button>
        <button
          className="main-button"
          onClick={() => {
            setStudentName(`${firstName} ${middleInitial}. ${lastName}`);
            setSelectedVotes({});
            setHasSubmitted(false);
            setView('verificationStep');
          }}
        >
          Sign In
        </button>
        <button className="back-button" onClick={() => setView('main')}>⬅️ Back</button>
      </>
    ) : (
      <div >
        
        <input
          className="input-field"
          placeholder="Student ID Number"
          value={studentID}
          onChange={(e) => setStudentID(e.target.value)}
        />

        
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
        />

<button
  className="main-button"
  style={{ marginTop: '20px' }}
  onClick={() => {
    // After verifying ID and password:
    const account = voterAccounts[studentID];
    if (!account) {
      alert('❌ Student ID not found.');
      return;
    }
    if (account.password !== passwordInput) {
      alert('❌ Incorrect password.');
      return;
    }

    // ✅ Store logged-in user info
    setStudentName(account.name); 
    setSelectedVotes({});
    setHasSubmitted(false);

    // ✅ Reset form fields
    setFirstName('');
    setMiddleInitial('');
    setLastName('');
    setCourse('');
    setYearLevel('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordError('');
    setIsIDConfirmed(false);
    setIsFaceConfirmed(false);

    // ✅ Check if user already voted
    if (hasVotedById[studentID]) {
      setView('alreadyVotedView'); // Show receipt + download + logout
    } else {
      setView('voterWelcome'); // Normal voting flow
    }

    // Keep studentID for alreadyVotedView
    setStudentID(studentID);
  }}
>
  Log In
</button>


        <button
  className="back-button"
  onClick={() => {
    // Reset inputs and hide login form
    setStudentID('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordError('');
    setShowLoginForm(false);
    setFirstName('');
    setMiddleInitial('');
    setLastName('');
    setCourse('');
    setYearLevel('');
    setView('voterInput');
  }}
>
  ⬅️ Back
</button>

      </div>
    )}
  </div>
)}

{view === "alreadyVotedView" && (
  <div className="content glowing-box" style={{ textAlign: "center", padding: "20px" }}>
    <h2>🎉 You Have Already Voted</h2>

    <p style={{ marginTop: "10px", marginBottom: "20px", fontSize: "18px" }}>
      <strong>Name:</strong> {studentName}
    </p>

    <h3>🧾 Your Voting Receipt</h3>

    <div
      style={{
        background: "#fff",
        borderRadius: "10px",
        padding: "15px",
        marginTop: "10px",
        maxWidth: "400px",
        marginLeft: "auto",
        marginRight: "auto",
        textAlign: "left",
        border: "1px solid #ddd"
      }}
    >
      {recordedVotes.voteRecords
        .filter((rec) => rec.name === studentName)
        .map((rec, i) => (
          <div key={i}>
            {Object.entries(rec.votes).map(([position, candidate]) => (
              <p key={position}>
                <strong>{position}:</strong> {candidate}
              </p>
            ))}
          </div>
        ))}
    </div>

    {/* Buttons: Logout + Download */}
    <div style={{ marginTop: "25px", display: "flex", justifyContent: "center", gap: "15px" }}>
      <button
        className="main-button"
        onClick={() => {
          setStudentID("");
          setStudentName("");
          setView("main");
        }}
      >
        🚪 Logout
      </button>

      <button
        className="custom-button"
        onClick={() => {
          const rec = recordedVotes.voteRecords.find(r => r.name === studentName);
          if (!rec) return;

          let text = `MCII Voting Receipt\n\nName: ${studentName}\n\nVotes:\n`;
          Object.entries(rec.votes).forEach(([pos, cand]) => {
            text += `${pos}: ${cand}\n`;
          });

          const blob = new Blob([text], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Voting_Receipt_${studentName}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        📥 Download Receipt
      </button>
    </div>
  </div>
)}


{view === "voteReceipt" && (
  <div className="content glowing-box scrollable">
    <h2 className="title">🧾 Voting Receipt</h2>

    <div style={{ marginTop: "20px", maxWidth: "800px", marginLeft: "auto", marginRight: "auto" }}>
      <p><strong>Voter:</strong> {studentName}</p>
      <p><strong>Date:</strong> {new Date().toLocaleString()}</p>

      <div style={{ marginTop: "16px", borderRadius: "8px", padding: "12px", background: "#fff" }}>
        {receiptData.map((item, i) => (
          <div key={i} style={{ marginBottom: "12px" }}>
            <div style={{ fontWeight: "bold" }}>{item.position}</div>
            <div style={{ marginLeft: "8px" }}>{item.candidate}</div>
            <hr />
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "18px" }}>
      <button
        className="main-button"
        onClick={downloadReceiptPDF}
      >
        ⬇️ Download Receipt (PDF)
      </button>

      <button
        className="main-button"
        onClick={downloadReceiptTxt}
      >
        ⬇️ Download Receipt (TXT)
      </button>

      <button
        className="main-button"
        style={{ backgroundColor: "red" }}
        onClick={handleLogout}
      >
        🚪 Logout
      </button>
    </div>
  </div>
)}


{view === 'verificationStep' && (
  <div className="login-section">
    <h2 className="title">✅ Sign in</h2>
    
    <input
      className="input-field"
      placeholder="First Name"
      value={firstName}
      onChange={(e) => setFirstName(e.target.value)}
    />
    <input
      className="input-field"
      placeholder="Middle Initial"
      value={middleInitial}
      onChange={(e) => setMiddleInitial(e.target.value)}
      maxLength={1}
    />
    <input
      className="input-field"
      placeholder="Last Name"
      value={lastName}
      onChange={(e) => setLastName(e.target.value)}
    />
  
  <div>
  <input
    className="input-field"
    placeholder="Student ID Number"
    value={studentID}
    onChange={(e) => {
      const value = e.target.value;

      // Allow only up to 6 digits
      if (/^\d{0,6}$/.test(value)) {
        setStudentID(value);

        // Check if ID is already signed in / already voted
        if (hasVotedById[value]) {
          setIsIDAlreadySignedIn(true);
        } else {
          setIsIDAlreadySignedIn(false);
        }
      }
    }}
    style={{
      border: isIDAlreadySignedIn ? "2px solid red" : "2px solid #ccc",
      outline: "none"
    }}
  />

  {/* 🔴 Warning Text */}
  {isIDAlreadySignedIn && (
    <p style={{ color: "red", marginTop: "5px", fontWeight: "bold" }}>
      ⚠️ This ID number is already signed in.
    </p>
  )}
</div>


  <small style={{ color: 'darkgray', display: 'block', marginTop: '4px' }}>
    NOte: Make sure your ID no. is correct
  </small>



  <select
  className="input-field"
  value={course}
  onChange={(e) => {
    setCourse(e.target.value);
    // Reset year level if MIDWIFERY and previously selected 3 or 4
    if (e.target.value === "MIDWIFERY" && (yearLevel === "3" || yearLevel === "4")) {
      setYearLevel('');
    }
  }}
>
  <option value="">-- Select Course --</option>
  <option value="BSCS">BSCS</option>
  <option value="BEED">BEED</option>
  <option value="BSHM">BSHM</option>
  <option value="BSCRIM">BSCRIM</option>
  <option value="BSPHAMA">BSPHAMA</option>
  <option value="MIDWIFERY">MIDWIFERY</option>
</select>

<select
  className="input-field"
  value={yearLevel}
  onChange={(e) => setYearLevel(e.target.value)}
>
  <option value="">-- Select Year Level --</option>
  {(course === "MIDWIFERY" ? [1, 2] : [1, 2, 3, 4]).map((year) => (
    <option key={year} value={year}>{year}</option>
  ))}
</select>

    <div>
  <small style={{ color: 'darkgray', display: 'block', marginBottom: '4px' }}>
    🔒 Note: Password must be at least 6 characters long.
  </small>
  <input
    className="input-field"
    type="password"
    placeholder="Enter Password"
    value={passwordInput}
    onChange={(e) => {
      setPasswordInput(e.target.value);
      if (confirmPasswordInput && e.target.value !== confirmPasswordInput) {
        setPasswordError('❌ Passwords do not match.');
      } else {
        setPasswordError('');
      }
    }}
    required
  />



<input
  className="input-field"
  type="password"
  placeholder="Confirm Password"
  value={confirmPasswordInput}
  onChange={(e) => {
    setConfirmPasswordInput(e.target.value);
    if (passwordInput && e.target.value !== passwordInput) {
      setPasswordError('❌ Passwords do not match.');
    } else {
      setPasswordError('');
    }
  }}
  required
/></div>

{passwordError && (
  <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>{passwordError}</p>
)}



<div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0' }}>
<button
  className="main-button"
  onClick={() => {
    if (!firstName || !middleInitial || !lastName || !studentID || !course || !yearLevel) {
      alert("⚠️ Finish filling up your information first.");
      return;
    }
    setView('takeIdPictureView');
  }}
  disabled={isIDConfirmed || isIDAlreadySignedIn} // disabled if ID confirmed or already signed in
  style={{
    backgroundColor: isIDConfirmed ? 'green' : '',
    cursor: isIDConfirmed || isIDAlreadySignedIn ? 'not-allowed' : 'pointer'
  }}
>
  {isIDConfirmed ? "✅ ID Confirmed" : "📸 Take ID Picture"}
</button>

<button
  className="main-button"
  onClick={() => setView('takeIdPictureInstruction')}
  disabled={!isIDConfirmed || isFaceConfirmed || isIDAlreadySignedIn} // disabled if ID not confirmed, face verified, or already signed in
  style={{
    backgroundColor: isFaceConfirmed ? 'green' : '',
    cursor: !isIDConfirmed || isFaceConfirmed || isIDAlreadySignedIn ? 'not-allowed' : 'pointer'
  }}
>
  {isFaceConfirmed ? "✅ Face Verified" : "👁️ Face Verification"}
</button>




</div>



<button
  className="custom-button"
  disabled={!isIDConfirmed || !isFaceConfirmed}
  style={{
    backgroundColor: isIDConfirmed && isFaceConfirmed ? '' : 'gray',
    cursor: isIDConfirmed && isFaceConfirmed ? 'pointer' : 'not-allowed'
  }}
  onClick={() => {
    if (!firstName || !middleInitial || !lastName || !studentID || !course || !yearLevel || !passwordInput || !confirmPasswordInput) {
      alert("⚠️ Please complete all fields before signing in.");
      return;
    }

    if (passwordInput !== confirmPasswordInput) {
      alert("❌ Passwords do not match.");
      return;
    }

    if (passwordInput.length < 6) {
      alert("❌ Password must be at least 6 characters.");
      return;
    }

    if (!isIDConfirmed || !isFaceConfirmed) {
      alert("❌ Please verify 📸 ID Picture and 👁️ Face Verification before signing in.");
      return;
    }

    // Save the new user
    const fullName = `${firstName} ${middleInitial}. ${lastName}`;
    setVoterAccounts(prev => ({
      ...prev,
      [studentID]: { password: passwordInput, name: fullName }
    }));

    setStudentName(fullName);
    setSelectedVotes({});
    setHasSubmitted(false);
    setView('voterWelcome');
  }}
>
  Sign In
</button>





<button
  className="back-button"
  onClick={() => {
    setIsIDConfirmed(false);       // Reset ID confirmation
    setIsFaceConfirmed(false);     // Reset Face confirmation
    setPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordError('');
    setFirstName('');
    setMiddleInitial('');
    setLastName('');
    setStudentID('');
    setCourse('');
    setYearLevel('');
    setView('voterInput');
  }}
>
  ⬅️ Back
</button>


  </div>
)}


      {view === 'voterWelcome' && (
        <div className="content scrollable">
          
         <img src="/5.png" alt="MCII Logo" className="logo" />
<h1 className="title">🎉 Welcome to MCII Voting System</h1> 
<h1 className="welcome animated-welcome">{studentName}!</h1>


<h3 className="sub">
  {course && yearLevel ? `${course} ${yearLevel}` : "--"}
</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '0px' }}>
          
        

  <button
    className="main-button"
    onClick={() => setView('voteNowView')}
    style={{ fontSize: '20px', padding: '12px 24px' }}
  >
    ✍️ VOTE MANUALLY
  </button>
  <button onClick={handleBackClick}>🡰 Back</button>
          </div>

          
        </div>
      )}
      {view === 'adminMenu' && (
        <div className="content scrollable">
          <h1 className="title">🧑‍💼 ADMIN PANEL</h1>
          <button className="menu-button" onClick={() => setView('viewAndAddCandidate')}>👥 View and Add Candidate</button>
          <button className="menu-button" onClick={() => setView('viewVotingResult')}>📊 View Voting Result</button>

          <button className="custom-button" onClick={handleBackClick}>🡰 Back</button>
        </div>
      )}
      {view === 'viewAndAddCandidate' && (
  <div className="candidate-container" style={{ textAlign: 'center', padding: '20px' }}>
    <h2>🏫 MCII COLLEGE CANDIDATE</h2>
  

    {view === 'viewAndAddCandidate' && (
  <div
    className="candidate-container"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '30px',
      backgroundColor: '#f0f8ff', // light blue background
      borderRadius: '15px',
      boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
      maxWidth: '950px',
      margin: '20px auto'
    }}
  >

    <h3 style={{ marginBottom: '20px', fontWeight: 'normal', color: '#555' }}>📥 Add New Candidate</h3>

    {/* ===== INPUT FIELDS IN ROW ===== */}
    <div
      className="add-form"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}
    >
      <select
        value={selectedPosition}
        onChange={(e) => setSelectedPosition(e.target.value)}
        style={{
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          minWidth: '200px',
          textAlign: 'center'
        }}
      >
        <option value="">-- Select Position --</option>
        {positions.map((pos, index) => (
          <option key={index} value={pos}>{pos}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Candidate Name"
        value={candidateName}
        onChange={(e) => setCandidateName(e.target.value)}
        style={{
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          minWidth: '200px',
          textAlign: 'center'
        }}
      />

      <input
        type="text"
        placeholder="Course and Year"
        value={courseYear}
        onChange={(e) => setCourseYear(e.target.value)}
        style={{
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          minWidth: '200px',
          textAlign: 'center'
        }}
      />

      <input
        type="text"
        placeholder="Add Partylist"
        value={partylist}
        onChange={(e) => setPartylist(e.target.value)}
        style={{
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          minWidth: '200px',
          textAlign: 'center'
        }}
      />
    </div>

    {/* Partylist Color Picker */}
    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
      <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Select Partylist Color:</label>
      <input
        type="color"
        value={partylistColor}
        onChange={(e) => setPartylistColor(e.target.value)}
        style={{
          width: '100px',
          height: '40px',
          cursor: 'pointer',
          border: 'none',
          borderRadius: '6px'
        }}
      />
    </div>

    {/* Photo Upload */}
    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPhoto(imageUrl); // store as displayable URL
          }
        }}
        style={{
          cursor: 'pointer',
          borderRadius: '6px',
          padding: '5px'
        }}
      />
    </div>

    {/* Buttons Row */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
    {/* Manual Submit Button */}
    <button
  onClick={() => {
    if (!selectedPosition || !candidateName || !courseYear) {
      alert("⚠️ Fill Position, Candidate Name, and Course/Year");
      return;
    }

    const newCandidate = {
      position: selectedPosition,
      name: candidateName,
      courseYear,
      partylist,
      partylistColor,
      photo
    };

    if (editingIndex !== null) {
      // Update existing candidate
      setCandidates(prev =>
        prev.map((c, i) => (i === editingIndex ? newCandidate : c))
      );
      setEditingIndex(null);
      setEditingPosition(null);
    } else {
      // Add new candidate
      setCandidates(prev => [...prev, newCandidate]);
    }

    // Reset form
    setSelectedPosition('');
    setCandidateName('');
    setCourseYear('');
    setPartylist('');
    setPartylistColor('#000000');
    setPhoto(null);
  }}
  style={{ padding: '8px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
>
  {editingIndex !== null ? 'Update Candidate' : 'Submit'}
</button>


{/* Automatic Add Button */}
<button
  onClick={() => {
    const defaultAvatar = "https://www.w3schools.com/howto/img_avatar.png"; // direct URL

    const autoCandidates = positions.flatMap(pos => ([
      { position: pos, name: `${pos} Candidate 1`, courseYear: 'BSCS 4', partylist: 'Blue Partylist', partylistColor: '#007bff', photo: defaultAvatar },
      { position: pos, name: `${pos} Candidate 2`, courseYear: 'BSCS 4', partylist: 'Red Partylist', partylistColor: '#dc3545', photo: defaultAvatar }
    ]));

    setCandidates(prev => [...prev, ...autoCandidates]);
  }}
  style={{ padding: '8px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
>
  Add Candidates Automatically
</button>






      <button
        onClick={() => setView('adminMenu')}
        style={{
          padding: '8px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        🡰 Back
      </button>
    </div>
  </div>
)}


  


{/* Candidate Display Below Form */}
<div className="candidate-list" style={{ marginTop: '40px' }}>
  {positions.map((pos, pIndex) => {
    const positionCandidates = candidates.filter(c => c.position === pos);
    if (positionCandidates.length === 0) return null;

    return (
      <div
        key={pIndex}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          gap: '20px',
          marginBottom: '30px',
          padding: '10px',
          borderBottom: '1px solid #ccc'
        }}
      >
        {/* Left: Position Name */}
        <div
          style={{
            minWidth: '200px',
            fontWeight: 'bold',
            fontSize: '18px',
            textTransform: 'uppercase',
            color: '#333'
          }}
        >
          {pos}
        </div>

        {/* Right: Candidates for this position */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            flex: 1
          }}
        >
          {positionCandidates.map((candidate, index) => (
            <div
              key={index}
              style={{
                width: '200px',
                border: '1px solid #ccc',
                borderRadius: '12px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                textAlign: 'center',
                transition: 'transform 0.2s'
              }}
            >
              {/* Partylist Banner */}
              {candidate.partylist && (
                <div
                  style={{
                    backgroundColor: candidate.partylistColor || '#000',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '6px 0',
                    textTransform: 'uppercase',
                    fontSize: '14px'
                  }}
                >
                  {candidate.partylist}
                </div>
              )}

              {/* Candidate Photo */}
              {candidate.photo ? (
                <img
                  src={candidate.photo}
                  alt={candidate.name}
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '180px',
                    backgroundColor: '#ccc',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#555'
                  }}
                >
                  No Photo
                </div>
              )}

              {/* Candidate Info */}
              <div style={{ padding: '10px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{candidate.name}</p>
                <p style={{ margin: '2px 0' }}>{candidate.courseYear}</p>

                {/* Edit & Delete Buttons */}
                <button
                  onClick={() => handleEditCandidate(index, pos)}
                  style={{
                    backgroundColor: '#ffc107',
                    color: '#000',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    marginRight: '5px'
                  }}
                >
                  ✏️ Edit
                </button>

                <button
                  onClick={() => handleDeleteCandidate(candidate)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  })}
</div>

</div>
)}

    


{view === 'straightVoteReceipt' && lastStraightVote && (
  <div className="content scrollable glowing-box" style={{ textAlign: 'center' }}>
    <h2>🧾 Voting Receipt</h2>
    <p style={{ marginBottom: '20px' }}>You voted for the <strong>{lastStraightVote.partylist}</strong> partylist.</p>

    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto 20px auto',
        padding: '15px',
        border: '1px solid #ccc',
        borderRadius: '10px',
        backgroundColor: '#f9f9f9',
        textAlign: 'left'
      }}
    >
      <h3>Voted Candidates:</h3>
      {positions.map((pos) => {
        const candidateIndex = lastStraightVote.votes[pos];
        const candidate = candidates[candidateIndex];
        return (
          <div key={pos} style={{ marginBottom: '8px' }}>
            <strong>{pos}:</strong>{" "}
            {candidate ? (
              <span style={{ color: '#007bff' }}>{candidate.name}</span>
            ) : (
              <span style={{ color: 'red' }}>No candidate</span>
            )}
          </div>
        );
      })}
    </div>

    {/* Action Buttons */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
      <button
        className="main-button"
        onClick={() => {
          // Simple CSV download
          let csv = "Position,Candidate\n";
          positions.forEach((pos) => {
            const candidateIndex = lastStraightVote.votes[pos];
            const candidate = candidates[candidateIndex];
            csv += `${pos},${candidate ? candidate.name : "No candidate"}\n`;
          });
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "straight_vote_receipt.csv";
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        ⬇️ Download
      </button>

      <button
        className="main-button"
        onClick={() => {
          setView("main");  // Log out/back to voter menu
          setSelectedPartylist('');
          setSelectedVotes({});
          setLastStraightVote(null);
        }}
      >
        🚪 Log Out
      </button>
    </div>
  </div>
)}



{view === 'viewVotingResult' && (
  <div className="content scrollable glowing-box">
    <h2 className="title">📊 Voting Results</h2>
    <div style={{ marginTop: '30px', textAlign: 'center' }}>
      <button className="custom-button" onClick={() => setView('adminMenu')}>🡰 Back</button>
    </div>
    {Object.keys(recordedVotes.votesCount).length === 0 ? (
      <p style={{ textAlign: 'center', marginTop: '20px' }}>No votes have been submitted yet.</p>
    ) : (
      <>
        {/* Filter voters */}
        
        {/* Grouped Results by Position */}
        {positions.map((pos, idx) => {
  const relatedCandidates = candidates.filter(c => c.position === pos);
  if (relatedCandidates.length === 0) return null;

  const colorClass = `color-${idx % 6}`;
  const maxVotes = Math.max(...relatedCandidates.map(c => recordedVotes.votesCount[`${pos}_${c.name}`] || 0));

  return (
    <div className="result-section">
  <h3 className="section-title">{pos}</h3>

  {relatedCandidates.map((c, i) => {
    const voteKey = `${pos}_${c.name}`;
    const count = recordedVotes.votesCount[voteKey] || 0;
    const percent = maxVotes > 0 ? Math.round((count / maxVotes) * 100) : 0;
    const rankIcon = i === 0 ? "" : i === 1 ? "" : i === 2 ? "" : `#${i + 1}`;

    return (
      <div key={i} className="candidate-result-row">
        {/* Left: Candidate Card */}
        <div className="candidate-card mini">
          <img src={c.photo || "/default-avatar.png"} alt={c.name} className="candidate-photo" />
          <div className="candidate-details">
            <h4>{c.name}</h4>
            <p>{c.courseYear}</p>
          </div>
        </div>

        {/* Right: Vote Result */}
        <div className="vote-bar-container">
          <span className="vote-label"><strong>{rankIcon} {}</strong> {count} vote(s) • {percent}%</span>
          <div className="bar-container">
            <div className="bar-fill" style={{ width: `${percent}%` }}>
              <span className="bar-percent">{percent}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>

  );
})}

        {/* Voter Records */}
        <div className="result-section">
          <h3 className="section-title">🧑 Individual Voter Records</h3>
          {recordedVotes.voteRecords
  .filter(r => r.name.toLowerCase().includes(searchTerm))
  .map((record, i) => (
    <div key={i} className="voter-card">
      <p>
        <strong>{record.name}</strong> voted:
        <button className="mini-button" onClick={() => toggleVoterExpand(i)}>
          {expandedVoters[i] ? '➖' : '➕'}
        </button>
        <button className="delete-button" onClick={() => handleDeleteVoter(i)}>🗑️</button>
      </p>
      {expandedVoters[i] && (
        <ul className="voter-vote-list">
          {Object.entries(record.votes).map(([pos, name], idx) => (
            <li key={idx}><strong>{pos}</strong>: {name}</li>
          ))}
        </ul>
      )}
    </div>
))}

        </div>

        {/* Download Buttons */}
        <div className="download-buttons">
          <button className="main-button" onClick={handleDownloadCSV}>⬇️ Download CSV</button>
          <button className="main-button" onClick={handleDownloadPDF}>⬇️ Download PDF</button>
        </div>
      </>
    )}

    
  </div>
)}


      {view === 'voteNowView' && (
        <div className="content scrollable glowing-box">
          <h2 className="title">🗳️ Select Your Candidate</h2>

          {hasVotedById[studentID] ? (
  <div className="thank-you">
    <h3>✅ Done Voting</h3>
    <p>Thanks for voting, <strong>{studentName}</strong>!</p>
    <button className="custom-button" onClick={() => setView('voterWelcome')}>🡰 Back</button>
  </div>
) : (
  
            <>
              <div className="position-candidate-container">
                {positions.map((position, idx) => {
                  const related = candidates.filter(c => c.position === position);
                  const selIdx = selectedVotes[position];
                  return (
                    <div key={idx} className="position-candidate-row">
                      <div className="position-name"><h3>{position}</h3></div>
                      <div className="cards-wrapper">
                        {related.length === 0 ? <i>No candidate yet</i> :
                          related.map((c, i) => {
                            const isSelected = selIdx === i;
                            const isBlur = selIdx !== undefined && !isSelected;
                            return (
                              <div key={i}
                                className={`candidate-card ${isBlur ? 'blurred' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => selIdx === undefined && setSelectedVotes({ ...selectedVotes, [position]: i })}
                                style={{ cursor: selIdx === undefined ? 'pointer' : 'default' }}
                              > {c.partylist && (
                                <div
                                  style={{
                                    backgroundColor: c.partylistColor || '#000',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    padding: '10px 0',
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                    borderRadius: '5px',
                                  }}
                                >
                                  {c.partylist}
                                </div>
                              )}
                              
                              
                                <img src={c.photo || "/default-avatar.png"} alt={c.name} className="candidate-photo" />
                                <div className="candidate-details">
                                  
                                  <h4>{c.name}</h4>
                                  <p>{c.courseYear}</p>
                                  {isSelected && (
                                    <button className="cancel-button" onClick={e => {
                                      e.stopPropagation();
                                      const nv = { ...selectedVotes };
                                      delete nv[position];
                                      setSelectedVotes(nv);
                                    }}>❌ Cancel</button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="action-buttons">
                <button className="custom-button" onClick={() => setView('voterWelcome')}>🡰 Back</button>
                <button className="main-button" onClick={handleSubmitVotes} disabled={Object.keys(selectedVotes).length !== positions.length}>
                  Submit
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
export default App;