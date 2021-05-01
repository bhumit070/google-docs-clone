import React, { useCallback, useEffect, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../css/styles.css';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
const TextEditor = () => {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const { id: documentId } = useParams();
  const SAVE_INTERVAL_MS = 2000;
  const TEXT_EDITOR_TOOLBAT_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['bold', 'italic', 'underline'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ align: [] }],
    ['image', 'blockquote', 'code-block'],
    ['clean'],
  ];

  useEffect(() => {
    if (
      socket === null ||
      socket === undefined ||
      quill === null ||
      quill === undefined
    )
      return;

    socket.once('load-document', (document) => {
      quill.setContents(document);
      quill.enable();
    });
    socket.emit('get-document', documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    const socketInstance = io('http://localhost:4000');
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket === undefined || quill === undefined) return;

    const handlerTextChange = () => (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta);
    };
    quill.on('text-change', handlerTextChange());

    return quill.off('text-change', handlerTextChange());
  }, [socket, quill]);

  useEffect(() => {
    if (socket === undefined || quill === undefined) return;
    const handlerTextChange = () => (delta) => {
      quill.updateContents(delta);
    };
    socket.on('receive-changes', handlerTextChange());

    return socket.off('receive-changes', handlerTextChange());
  }, [socket, quill]);

  useEffect(() => {
    if (
      socket === null ||
      socket === undefined ||
      quill === null ||
      quill === undefined
    )
      return;
    console.log(' i am called ');
    setInterval(() => {
      socket.emit('save-document', quill.getContents());
    }, SAVE_INTERVAL_MS);

    // return clearInterval(interval);
  }, [quill, socket]);

  const textEditorWrapper = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = '';
    const textEditor = document.createElement('div');
    wrapper.append(textEditor);
    const quillInstance = new Quill(textEditor, {
      theme: 'snow',
      modules: { toolbar: TEXT_EDITOR_TOOLBAT_OPTIONS },
    });
    quillInstance.disable();
    quillInstance.setText('Loading...');
    setQuill(quillInstance);
  }, []);

  return <div className="container" ref={textEditorWrapper} />;
};

export default TextEditor;
