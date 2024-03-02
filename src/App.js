import React, { useEffect, useRef, useState } from 'react';
import { Box, Divider, Grid, TextField, IconButton, List, ListItem, ListItemText, Avatar, Button, Typography, Popover, CircularProgress, Link, Skeleton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachmentIcon from '@mui/icons-material/Attachment';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import BlockIcon from '@mui/icons-material/Block'; // Importing Block icon for visual effect
import { AddDocumentData, UpdateDocumentData, UploadAttachment, getUserDetails, listenToDocumentData, loadMoreDocuments } from './contoller/chat';

function App() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [newMessageSent, setNewMessageSent] = useState(false);
  const [loadingHeight, setLoadingHeight] = useState("")
  const [uploadState, setUploadState] = useState({ status: false, name: "" })
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [details, setDetails] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);


  useEffect(() => {
    if (scrollRef.current && newMessageSent) {
      const scroll = scrollRef.current;
      scroll.scrollTop = scroll.scrollHeight;
      setNewMessageSent(false);
    }
  }, [chatHistory, newMessageSent]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const uId = queryParams.get("userId");
    setUserId(uId);
  }, []);

  // for get all massage
  useEffect(() => {
    if (userId) {
      const unsubscribe = listenToDocumentData(userId, (newData) => {
        console.log("newData: ", newData.chats);
        setChatHistory(newData.chats);
        setNewMessageSent(true);
      });

      // Cleanup function
      return () => {
        // Ensure unsubscribe is a function before calling it
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [userId]);
  // load more data
  const LoadMore = async () => {
    if (userId) {
      const unsubscribe = await loadMoreDocuments(userId, (newData) => {
        setChatHistory(previousChats => [...newData.chats, ...previousChats]);
        const newScrollHeight = scrollRef.current.scrollHeight;
        console.log("newScrollHeight: ", newScrollHeight);
        const scrollOffset = newScrollHeight - loadingHeight;
        scrollRef.current.scrollTop += scrollOffset;
      });


      return () => unsubscribe();
    }
  };

  // send massage
  const handleSendMessage = async () => {
    if (message.length > 200) {
      alert('Message cannot be more than 200 characters.');
      return;
    }

    if (message.trim() === '') {
      alert('Message cannot be empty');
      return;
    }

    const data = {
      type: "query",
      queryText: message,
    };

    setMessage('');
    // Blur the input field to hide the keyboard
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const result = await AddDocumentData(userId, data);
    console.log("result: ", result);

    if (result.status === "success") {
      console.log("success");
      setNewMessageSent(true);
    }
  };

  const fileInputChanged = async (val) => {
    setUploadState({ status: true, name: val.name })
    if (val.size > 10 * 1024 * 1024) {
      alert("File size should not exceed 10MB.");
      return;
    }
    const result = await UploadAttachment(userId, val)
    if (result.status === "success") {
      const data = {
        type: "attachment",
        url: result.url,
        mimeType: val.type
      }
      const result2 = await AddDocumentData(userId, data)
      console.log("result: ", result);
      if (result2.status === "success") {
        setUploadState({ status: false, name: "" })
      }
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // adjust scroll height
  useEffect(() => {
    const currentScrollHeight = scrollRef.current.scrollHeight;
    setLoadingHeight(currentScrollHeight);
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop } = scrollRef.current;
        if (scrollTop === 0) {
          LoadMore();
        }
      }
    };

    const currentScrollRef = scrollRef.current;
    currentScrollRef?.addEventListener("scroll", handleScroll);

    return () => {
      currentScrollRef?.removeEventListener("scroll", handleScroll);
    };
  }, [chatHistory]);

  const handleSelectOption = async (item, selectedOption) => {
    setLoading(true)
    const newArray = [];
    item.options.forEach(item => {
      if (item.option === selectedOption) {
        item.selected = !item.selected;
      }
      newArray.push(item);
    });

    const result = await UpdateDocumentData(userId, item.id, newArray)
    if (result.status === "success") {
      setLoading(false)
    }
  }

  const UserDetails = async () => {
    console.log("UserDetails: ");
    setLoading(true)
    const result = await getUserDetails(userId)
    if (result.status === "success") {
      setDetails(result.data);
      setLoading(false)
    } else {
      setDetails({ status: null });
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      UserDetails()
    }
  }, [userId]);

  const FullScreenView = () => {
    if (!isFullScreen) return null;

    const fullScreenStyles = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    };

    return (
      <div style={fullScreenStyles} onClick={() => setIsFullScreen(false)}>
        <img src={fullScreenImage} alt="Full Screen" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
    );
  };


  const handleMessageDesign = (item) => {

    if (item.type === "query") {
      return (
        <>
          {item.queryText}
        </>
      )
    } else if (item.type === "question") {
      return (
        <>
          {item.questionText}
          {item.options && item.options.length > 0 &&
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {item.options.map((option, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Button color={option.selected ? "success" : "primary"} onClick={() => handleSelectOption(item, option.option)} fullWidth variant="contained" size="small">
                    {option.option}
                  </Button>
                </Grid>
              ))}
            </Grid>
          }
        </>
      )
    } else if (item.type === "attachment") {
      function extractFileName(url) {
        // Find the part of the URL between '/o/' and the '?' character
        const regex = /\/o\/(.+?)\?/;
        const match = url.match(regex);
        const encodedPath = match ? match[1] : '';
        // Decode the URI component to get the actual file path
        const decodedPath = decodeURIComponent(encodedPath);

        // Split the path by '/' and get the last segment, which is the filename
        const pathSegments = decodedPath.split('/');
        return pathSegments.pop();
      }

      function getFileIcon(mimeType) {
        switch (mimeType) {
          case "application/pdf":
            return "📄"; // Placeholder for PDF icon
          default:
            return "📁"; // Generic file icon for unknown types
        }
      }

      return (
        <>
          <Grid container>
            <Grid item xs={12}>
              {item.mimeType === "image/png" || item.mimeType === "image/jpeg" ?
                <>
                  {uploadState.status && uploadState.name === extractFileName(item.url) ?
                    <Skeleton variant="rectangular" width="200px" height={118} />
                    :
                    <Box width={"100%"} component={"img"} src={item.url} alt='Image'
                      onClick={() => {
                        setFullScreenImage(item.url);
                        setIsFullScreen(true);
                      }}
                    />
                  }
                </>
                :
                <>
                  {uploadState.status && uploadState.name === extractFileName(item.url) ?
                    <Skeleton variant="rectangular" width="200px" height={30} />
                    :
                    <Button component="a" href={item.url} download={extractFileName(item.url)}>
                      <span>{getFileIcon(item.mimeType)}</span>
                      <Typography variant='caption'>
                        {extractFileName(item.url)}
                      </Typography>
                    </Button>
                  }
                </>
              }
            </Grid>
          </Grid>
        </>
      )
    }
  }

  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };


  const formatTime = (date) => {
    return new Date(date * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    // Format the timestamp into a readable date string
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <>
      <Box sx={{
        width: { md: "400px", xs: "100%" },
        borderInline: { md: "1px solid black", sm: "none" },
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', paddingInline: 1 }} ref={scrollRef}>
          {details.status === 'active' &&
            <>
              {chatHistory &&
                <List>
                  {chatHistory.map((item, index) => {
                    const prevItem = chatHistory[index - 1];
                    const isNewDay = !prevItem || formatDate(item.timeStamp) !== formatDate(prevItem.timeStamp);

                    return (
                      <>
                        {isNewDay && (
                          <Box sx={{ width: '100%', textAlign: 'center', my: 2 }}>
                            <Typography variant="caption">
                              <Divider>
                                {formatDate(item.timeStamp)}
                              </Divider>
                            </Typography>
                          </Box>
                        )}
                        <ListItem key={index} sx={{
                          display: 'flex',
                          flexDirection: item.userType === "admin" ? 'row-reverse' : 'row',
                          justifyContent: 'flex-end',
                          alignItems: 'end',
                          columnGap: 1,
                          mb: 2,
                        }}>
                          <Box sx={{
                            bgcolor: item.userType === "admin" ? '#e0f7fa' : '#ffecb3',
                            p: 1,
                            borderRadius: item.userType === "admin" ? '20px 5px 20px 0px' : "5px 20px 0px 20px",
                            maxWidth: '70%',
                            textAlign: 'left',
                            wordBreak: 'break-word',
                            position: 'relative',
                            boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.16)',
                            '&:hover': { boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.32)' },
                          }}>
                            <ListItemText
                              sx={{ position: "relative", zIndex: 2, my: 0 }}
                              primary={
                                <>
                                  {handleMessageDesign(item)}
                                </>
                              }
                            />
                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                              <Typography sx={{ fontStyle: "italic", fontSize: "10px" }} variant='caption'>{formatTime(item.timeStamp.seconds)}</Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Avatar sx={{ width: 24, height: 24, backgroundColor: "aliceblue" }} src={item.userType === "client" ? details.imgUlr : '/images/chatLogo.png'} />
                          </Box>
                        </ListItem>
                      </>
                    )
                  })}
                </List>
              }
            </>
          }
          {details.status === 'block' &&
            <Box sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              backgroundColor: "#f2f2f2",
              // padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            }}>
              <BlockIcon sx={{ fontSize: 60, color: "#ff1744" }} />
              <Typography variant='h6' sx={{ marginTop: "10px", color: "#333", fontWeight: "bold" }}>
                This Chat is Blocked by the Admin
              </Typography>
              <Typography sx={{ color: "#666", marginTop: "5px" }}>
                Please contact support for more information.
              </Typography>
            </Box>
          }
          {details.status === null &&
            <Box sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              backgroundColor: "#f2f2f2",
              // padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            }}>
              <EventOutlinedIcon color='primary' sx={{ fontSize: 60 }} />
              <Typography variant='h6' sx={{ marginTop: "10px", color: "#333", fontWeight: "bold", lineHeight: 1.3 }}>
                You haven't booked a consultation package yet. Please book at least one package to start the conversation.              </Typography>
              <Typography sx={{ color: "#666", marginTop: 2 }}>
                Please contact support for more information.
              </Typography>
            </Box>
          }
        </Box>

        <Box>
          <Divider />
          <Grid container spacing={1} sx={{ py: 1 }}>
            <Grid item xs={1.2}>
              <IconButton
                color="primary"
                disabled={details.status !== "active"}
                aria-label="upload attachment"
                component="span"
                sx={{ position: "relative" }}
              >
                <input type="file" onChange={(e) => fileInputChanged(e.target.files[0])} id="fileInput" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, opacity: 0 }} />
                <AttachmentIcon />
              </IconButton>
            </Grid>
            <Grid item xs={8.7}>
              <TextField
                size='small'
                disabled={details.status !== "active"}
                fullWidth
                value={message}
                onChange={handleMessageChange}
                placeholder="Type a message"
                onKeyPress={handleKeyPress}
                inputRef={inputRef}
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton disabled={details.status !== "active"} color="primary" onClick={handleSendMessage}>
                <SendIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
        <FullScreenView />
        {loading &&
          <Box sx={{ position: "absolute", top: 0, bottom: 0, right: 0, left: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <CircularProgress />
          </Box>
        }
      </Box >
    </>
  );
}

export default App;
