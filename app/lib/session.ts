interface SessionEventHandlers {
  ontrack?: (e: RTCTrackEvent) => void;
  onopen?: () => void;
  onmessage?: (msg: any) => void; // Consider a more specific type for msg
  onerror?: (e: any) => void;
  onconnectionstatechange?: (state: RTCPeerConnectionState) => void;
}

export class Session implements SessionEventHandlers {
  private apiKey: string;
  private useSessionToken: boolean;
  private ms: MediaStream | null;
  private pc: RTCPeerConnection | null;
  private dc: RTCDataChannel | null;
  public muted: boolean;

  // Event handlers
  public ontrack?: (e: RTCTrackEvent) => void;
  public onopen?: () => void;
  public onmessage?: (msg: any) => void;
  public onerror?: (e: any) => void;
  public onconnectionstatechange?: (state: RTCPeerConnectionState) => void;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.useSessionToken = true; // Defaulting to true as in original
    this.ms = null;
    this.pc = null;
    this.dc = null;
    this.muted = false;
  }

  async start(
    stream: MediaStream,
    sessionConfig: any,
    tokenEndpointPath: string = "/v1/realtime/sessions"
  ) {
    await this.startInternal(stream, sessionConfig, tokenEndpointPath);
  }

  // Original had startTranscription, keeping start flexible with tokenEndpointPath
  // async startTranscription(stream: MediaStream, sessionConfig: any) {
  //   await this.startInternal(stream, sessionConfig, "/v1/realtime/transcription_sessions");
  // }

  stop() {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.ms) {
      this.ms.getTracks().forEach((t) => t.stop());
      this.ms = null;
    }
    this.muted = false;
  }

  setMuted(muted: boolean) {
    // Renamed from mute to avoid conflict with this.muted and for clarity
    this.muted = muted;
    if (this.pc) {
      this.pc.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.enabled = !muted;
        }
      });
    }
  }

  private async startInternal(
    stream: MediaStream,
    sessionConfig: any,
    tokenEndpoint: string
  ) {
    this.ms = stream;
    this.pc = new RTCPeerConnection();
    this.pc.ontrack = (e) => this.ontrack?.(e);
    stream.getTracks().forEach((track) => {
      if (this.pc) this.pc.addTrack(track, stream);
    });
    this.pc.onconnectionstatechange = () => {
      if (this.pc) this.onconnectionstatechange?.(this.pc.connectionState);
    };

    this.dc = this.pc.createDataChannel("OpenAI-Realtime"); // Giving it a label
    this.dc.onopen = () => this.onopen?.();
    this.dc.onmessage = (e) => {
      try {
        const parsedData = JSON.parse(e.data);
        this.onmessage?.(parsedData);
      } catch (error) {
        console.error("Failed to parse message data:", e.data, error);
        this.onerror?.({
          message: "Failed to parse message data",
          data: e.data,
          originalError: error,
        });
      }
    };
    this.dc.onerror = (e) => this.onerror?.(e);
    this.dc.onclose = () => console.log("Data channel closed");

    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      const answer = await this.signal(offer, sessionConfig, tokenEndpoint);
      await this.pc.setRemoteDescription(answer as RTCSessionDescriptionInit);
    } catch (e) {
      this.onerror?.(e);
    }
  }

  private async signal(
    offer: RTCSessionDescriptionInit,
    sessionConfig: any,
    tokenEndpointPath: string
  ) {
    const urlRoot = "https://api.openai.com";
    const realtimeSdpExchangeUrl = `${urlRoot}/v1/realtime`; // URL for SDP exchange
    let sdpResponse;

    if (this.useSessionToken) {
      const sessionTokenUrl = `${urlRoot}${tokenEndpointPath}`;
      const sessionTokenResponse = await fetch(sessionTokenUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "openai-beta": "realtime-v1", // Custom header OpenAI might require
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionConfig),
      });
      if (!sessionTokenResponse.ok) {
        const errorBody = await sessionTokenResponse.text();
        console.error(
          "Failed to request session token:",
          sessionTokenResponse.status,
          errorBody
        );
        throw new Error(
          `Failed to request session token: ${sessionTokenResponse.status} ${errorBody}`
        );
      }
      const sessionData = await sessionTokenResponse.json();
      const clientSecret = sessionData.client_secret?.value; // Safely access client_secret.value
      if (!clientSecret) {
        console.error("client_secret not found in session token response:", sessionData);
        throw new Error("client_secret not found in session token response");
      }

      sdpResponse = await fetch(realtimeSdpExchangeUrl, {
        // Use the dedicated SDP exchange URL
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
      });
      if (!sdpResponse.ok) {
        const errorBody = await sdpResponse.text();
        console.error(
          "Failed to signal (SDP exchange with session token):",
          sdpResponse.status,
          errorBody
        );
        throw new Error(
          `Failed to signal (SDP exchange with session token): ${sdpResponse.status} ${errorBody}`
        );
      }
    } else {
      // This `else` block for FormData based signaling might be legacy or for different configuration
      // Ensure this is still a supported path if useSessionToken can be false.
      const formData = new FormData();
      formData.append("session", JSON.stringify(sessionConfig));
      formData.append("sdp", offer.sdp as string); // SDP is a string
      sdpResponse = await fetch(realtimeSdpExchangeUrl, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!sdpResponse.ok) {
        const errorBody = await sdpResponse.text();
        console.error(
          "Failed to signal (SDP exchange with API key directly):",
          sdpResponse.status,
          errorBody
        );
        throw new Error(
          `Failed to signal (SDP exchange with API key directly): ${sdpResponse.status} ${errorBody}`
        );
      }
    }
    return { type: "answer", sdp: await sdpResponse.text() };
  }

  sendMessage(message: any) {
    // Consider a more specific type for message
    if (this.dc && this.dc.readyState === "open") {
      this.dc.send(JSON.stringify(message));
    } else {
      console.warn("Data channel not open, cannot send message:", message);
      this.onerror?.({
        message: "Data channel not open, cannot send message",
        data: message,
      });
    }
  }
}
