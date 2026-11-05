---
slug: network-kpi-throughput-latency-drop-rate
title: 'What is a network KPI? Throughput, latency, drop rate explained'
description: >-
  Throughput, latency, jitter, packet loss, drop rate, signal strength: the
  indicators that measure a mobile network’s quality, explained with orders of
  magnitude.
excerpt: >-
  Throughput, latency, jitter, packet loss, drop rate, signal strength: the
  indicators that measure a mobile network’s quality, explained with orders of
  magnitude.
keywords:
  - network kpi
  - internet speed
  - latency
  - ping
  - drop rate
  - mobile network quality
  - rsrp
sourceHash: d5f16b352a4f7fc94aafbc5a
translatedAt: '2026-11-04T14:17:53.301Z'
---
“The network is bad.” Everyone has said it, but bad how? Slow to load a video, choppy on calls, or simply cut off? Telecom engineers measure network quality with **KPIs** (Key Performance Indicators). Knowing them helps you describe a problem precisely, compare plans and understand a speed test.

## Throughput: data per second

**Throughput** measures how much data gets through each second, in **megabits per second** (Mbit/s). There are two:

- **download** throughput: what you receive (a video, a web page, a download);
- **upload** throughput: what you send (a photo you post, your video in a call).

Upload is almost always lower than download, hence the video calls where others see you blurry while you see them clearly.

**Mind the units**: throughput is expressed in **bits**, a file in **bytes**. One byte is 8 bits. At 40 Mbit/s, you download about 5 MB per second, not 40.

**Orders of magnitude**: an HD video needs a few Mbit/s; a video call, 1 to 3 Mbit/s each way.

## Latency: reaction time

**Latency** is the round-trip time between your device and a server, in **milliseconds** (ms). It’s the “ping” of speed tests. It says nothing about the amount of data, only about **responsiveness**.

A network can have great throughput and poor latency: the video loads fine, but an online game or a video call reacts late.

**Orders of magnitude**: under 30 ms is excellent; a 4G connection often runs between 30 and 60 ms; above 100 ms, video conversations start to suffer. Distance matters: a server on another continent alone adds several dozen milliseconds.

## Jitter and packet loss: regularity

Two lesser-known indicators explain many “bad calls”:

- **jitter**: how much latency varies from one moment to the next. A steady 60 ms works better than latency jumping from 20 to 200 ms;
- **packet loss**: the share of data that never arrives. Above 1 to 2%, voice breaks up and video freezes.

A WhatsApp call that makes your voice sound robotic is almost always jitter or packet loss, rarely a throughput problem.

## Drop rate and accessibility

On the operator side, two KPIs matter enormously:

- the **accessibility rate**: the share of calls or connections that **manage to be set up**. A call that doesn’t go through at all lowers this figure;
- the **drop rate**: the share of calls that **cut off midway**, often during a badly handled antenna switch or in a poorly covered area.

Operators track these figures cell by cell. An antenna whose drop rate climbs signals a problem: failure, overload or interference.

## Signal strength: RSRP, RSRQ and SINR

Your phone’s bars simplify a finer measurement. In 4G, technicians mostly look at:

- **RSRP**: the received signal power, in dBm (a negative value). The closer to zero, the better. Common guideline: better than -80 dBm, excellent; between -90 and -100 dBm, fair; below -110 dBm, very weak;
- **RSRQ** and **SINR**: the signal’s **quality**, meaning how much it’s scrambled by other antennas and noise.

You can have a strong but poor-quality signal, for example near several antennas interfering with each other. On Android, these values often appear in the phone status information, or in network measurement apps.

## Measure your connection properly

A single speed test proves little. For a serious diagnosis:

1. **Test at different times**: in the evening, when the whole neighborhood is online, speed often drops.
2. **Note all three numbers**: download, upload and latency.
3. **Test in the same spot**, phone still: one meter closer to a window can change everything.
4. **Compare with another device** to rule out a phone problem.

With these numbers, you can tell your operator “2 Mbit/s and 150 ms latency every evening between 7 and 10 pm” instead of “it’s slow”. That’s far more useful to get an answer.

## Key takeaways

- **Throughput** = amount of data per second; **latency** = reaction time.
- 1 byte = 8 bits: divide a speed in Mbit/s by 8 to get MB/s.
- **Jitter** and **packet loss** explain most choppy calls.
- Operators track the **accessibility** and **drop rate** of every antenna.

To understand where these numbers come from, read our article on [how a mobile network works](/en/blog/how-a-mobile-network-works).
