import { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

function App() {
    const [videoError, setVideoError] = useState(null);
    const videoElement = useRef(null);
    const canvasElement = useRef(null);
    const [devices, setDevices] = useState([]);
    const [currentDevice, setCurrentDevice] = useState(null);
    const [loop, setLoop] = useState();
    const [loading, setLoading] = useState(true);
    const loadCoco = async () => {
        const model = await cocoSsd.load();
        setLoading(false);
        setLoop(
            setInterval(() => {
                detectCoco(model);
            }, 500)
        );
    };
    const detectCoco = async (model) => {
        const predictions = await model.detect(videoElement.current);
        canvasElement.current.width = videoElement.current.videoWidth;
        canvasElement.current.height = videoElement.current.videoHeight;
        const ctx = canvasElement.current.getContext("2d");
        drawCanvas(predictions, ctx);
    };
    const drawCanvas = (predictions, ctx) => {
        predictions.forEach((prediction) => {
            let [x, y, width, height] = prediction["bbox"];
            let text = prediction["class"];
            ctx.beginPath();
            let color = "#ff002b";
            ctx.strokeStyle = color;
            ctx.font = "30px Nunito";
            ctx.fillStyle = color;
            ctx.fillText(text, x, y - 15);
            ctx.lineWidth = 5;
            ctx.rect(x, y, width, height);
            ctx.stroke();
        });
    };
    useEffect(() => {
        let constrain = {
            width: 1280,
            height: 720,
        };
        setCurrentDevice(localStorage.getItem("deviceId"));
        navigator.getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

        if (navigator.getUserMedia) {
            navigator.mediaDevices.enumerateDevices().then((devices) => {
                const videoDevice = devices.filter(
                    (device) => device.kind === "videoinput"
                );
                console.log(videoDevice);
                setDevices(videoDevice);
            });
            console.log(currentDevice);
            if (currentDevice) constrain.deviceId = currentDevice;
            navigator.getUserMedia(
                { audio: false, video: constrain },
                (stream) => {
                    let video = videoElement.current;
                    video.srcObject = stream;
                    video.onloadedmetadata = () => {
                        video.play();
                        loadCoco();
                    };
                },
                (err) => {
                    setVideoError("The following error occurred: " + err.name);
                    setLoading(false);
                }
            );
        } else {
            setVideoError("getUserMedia not supported");
            setLoading(false);
        }
        return () => {
            clearInterval(loop);
        };
    }, [currentDevice, videoElement]);
    const handleChange = (e) => {
        clearInterval(loop);
        let current = e.target.value;
        setCurrentDevice(current);
        localStorage.setItem("deviceId", current);
    };
    return (
        <div className="container py-3">
            <h3 className="text-center text-primary">
                Tensorflow Object Detection
            </h3>
            <p className="text-center text-color1">
                Simple ReactJs app integrated with object detection model name
                COCO-SSD.
            </p>
            {videoError && (
                <p className="text-danger text-center">{videoError}</p>
            )}
            {loading && (
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}
            <div className={loading ? "none" : ""}>
                <div className="video__container">
                    <video
                        className="video__element"
                        ref={videoElement}
                        muted={true}
                        autoPlay
                    ></video>
                    <canvas
                        className="canvas__element"
                        ref={canvasElement}
                    ></canvas>
                </div>
                <div className="mb-3">
                    <label className="form-label text-color1">
                        Select your device
                    </label>
                    <select
                        className="form-control"
                        onChange={handleChange}
                        value={currentDevice ? currentDevice : ""}
                    >
                        {devices.map((device) => (
                            <option
                                key={device.deviceId}
                                value={device.deviceId}
                            >
                                {device.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

export default App;
