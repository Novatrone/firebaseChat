import React, { useEffect, useRef, useState } from 'react';
import { Box, Divider, Grid, TextField, IconButton, List, ListItem, ListItemText, Avatar, Button, Typography, Popover, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachmentIcon from '@mui/icons-material/Attachment';
import { AddDocumentData, UpdateDocumentData, getDocumentData } from './contoller/chat';

function App() {
  const [message, setMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [chatHistory, setChatHistory] = useState(null);
  const [stopScroll, setStopScroll] = useState(true)
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && stopScroll) {
      const scroll = scrollRef.current;
      scroll.scrollTop = scroll.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const bId = queryParams.get("bookingId");
    const uId = queryParams.get("userId");
    setBookingId(bId);
    setUserId(uId);
  }, []);


  const getData = async () => {
    setLoading(true)
    if (bookingId && userId) {
      const result = await getDocumentData(bookingId, userId)
      const formatData = filterData(result.chats);
      console.log("formatData2: ", formatData);
      setChatHistory(formatData)
      setLoading(false);
    }
  }

  const filterData = (formatData) => {
    console.log("formatData1: ", formatData);
    const data = formatData.sort((a, b) => new Date(a.timeStamp.seconds) - new Date(b.timeStamp.seconds));
    return data
  }

  useEffect(() => {
    getData()
  }, [bookingId, userId])

  const handleSendMessage = async () => {

    if (message.length > 200) {
      alert('Message cannot be more than 200 characters.');
      return;
    }

    setLoading(true)
    setStopScroll(true)
    const data = {
      type: "query",
      queryText: message,
    }
    const result = await AddDocumentData(bookingId, userId, data)
    console.log("result: ", result);
    if (result.status === "success") {
      setMessage('');
      getData()
      setLoading(false)
    }
  };

  const handleSelectOption = async (item, selectedOption) => {
    setLoading(true)
    setStopScroll(false)
    const newArray = [];
    item.options.forEach(item => {
      if (item.option === selectedOption) {
        item.selected = !item.selected;
      }
      newArray.push(item);
    });

    const result = await UpdateDocumentData(bookingId, userId, item.id, newArray)
    if (result.status === "success") {
      getData()
    }
  }

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
          {item.question}
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
      return (
        <>
          <Grid container>
            <Grid item xs={12} sm={6}>
              <Box width={"100%"} component={"img"} src={item.url} alt='Image' />
            </Grid>
          </Grid>
        </>
      )
    }
  }

  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const formatTime = (date) => {
    return new Date(date * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    // Format the timestamp into a readable date string
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const open = Boolean(anchorEl);

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
                        <Avatar sx={{ width: 24, height: 24 }} src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnS1o3mO3S_Nkfw1WAGaRJ6KaOGgODpfoOsA&usqp=CAU' />
                      </Box>
                    </ListItem>
                  </>
                )
              })}
            </List>
          }
        </Box>

        <Box>
          <Divider />
          <Grid container spacing={1} sx={{ py: 1 }}>
            <Grid item xs={1.2}>
              <IconButton color="primary" aria-label="upload attachment" component="span" onClick={handlePopoverOpen}>
                <AttachmentIcon />
              </IconButton>
              <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
              >
                <Typography sx={{ p: 2 }}>Your popover content here</Typography>
              </Popover>
            </Grid>
            <Grid item xs={8.7}>
              <TextField
                size='small'
                fullWidth
                value={message}
                onChange={handleMessageChange}
                placeholder="Type a message"
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton color="primary" onClick={message.length ? handleSendMessage : () => console.log("enter msg")}>
                <SendIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
        {loading &&
          <Box sx={{ position: "absolute", top: 0, bottom: 0, right: 0, left: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <CircularProgress />
          </Box>
        }
      </Box>
    </>
  );
}

export default App;
