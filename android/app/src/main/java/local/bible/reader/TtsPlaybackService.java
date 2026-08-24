package local.bible.reader;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;

public class TtsPlaybackService extends Service {
    static final String CHANNEL = "tts";
    static final int NOTICE_ID = 17;
    static final String ACTION_STOP = "local.bible.reader.action.TTS_STOP";

    private MediaSession session;

    public static void show(Context context, String title, String text) {
        Intent intent = new Intent(context, TtsPlaybackService.class);
        intent.putExtra("title", title == null ? "朗读" : title);
        intent.putExtra("text", text == null ? "" : text);
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent);
        else context.startService(intent);
    }

    public static void hide(Context context) {
        context.stopService(new Intent(context, TtsPlaybackService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "朗读", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("圣经朗读正在进行");
            channel.setSound(null, null);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
        session = new MediaSession(this, "bible-tts");
        session.setCallback(new MediaSession.Callback() {
            @Override
            public void onPause() {
                stopReading();
            }

            @Override
            public void onStop() {
                stopReading();
            }
        });
        session.setActive(true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopReading();
            return START_NOT_STICKY;
        }
        String title = intent != null ? intent.getStringExtra("title") : "朗读";
        String text = intent != null ? intent.getStringExtra("text") : "";
        if (title == null || title.isEmpty()) title = "朗读";
        if (text == null) text = "";
        updateSession(title, text);
        startForeground(NOTICE_ID, buildNotice(title, text));
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (session != null) {
            session.setActive(false);
            session.release();
            session = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void stopReading() {
        TtsBridge bridge = TtsBridge.current();
        if (bridge != null) bridge.stopFromSystem();
        stopForeground(true);
        stopSelf();
    }

    private void updateSession(String title, String text) {
        if (session == null) return;
        session.setMetadata(new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, title)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, "本地圣经")
                .putString(MediaMetadata.METADATA_KEY_ALBUM, text)
                .build());
        session.setPlaybackState(new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_STOP)
                .setState(PlaybackState.STATE_PLAYING, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1f)
                .build());
    }

    private Notification buildNotice(String title, String text) {
        Intent launch = new Intent(this, MainActivity.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent content = PendingIntent.getActivity(this, 0, launch, flags);
        Intent stopIntent = new Intent(this, TtsPlaybackService.class).setAction(ACTION_STOP);
        PendingIntent stop = PendingIntent.getService(this, 1, stopIntent, flags);
        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= 26) builder = new Notification.Builder(this, CHANNEL);
        else builder = new Notification.Builder(this);
        builder.setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(text)
                .setContentIntent(content)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .addAction(android.R.drawable.ic_media_pause, "停止", stop)
                .setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0));
        return builder.build();
    }
}
