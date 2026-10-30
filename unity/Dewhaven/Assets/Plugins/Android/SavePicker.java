package com.fajar.dewhaven;

import android.app.Activity;
import android.app.Fragment;
import android.content.Intent;
import android.os.Bundle;
import com.unity3d.player.UnityPlayer;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/** System document picker. No broad storage permission, custom path, or recipient is used. */
public final class SavePicker extends Fragment {
    private static final int REQUEST = 6914;
    private String receiver, mode, content;
    public static void begin(final Activity activity, final String receiver, final String mode, final String content) {
        activity.runOnUiThread(() -> {
            if (activity.getFragmentManager().findFragmentByTag("DewhavenSavePicker") != null) return;
            SavePicker picker = new SavePicker();
            Bundle args = new Bundle(); args.putString("receiver", receiver); args.putString("mode", mode); args.putString("content", content);
            picker.setArguments(args);
            activity.getFragmentManager().beginTransaction().add(picker, "DewhavenSavePicker").commitAllowingStateLoss();
        });
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        receiver=getArguments().getString("receiver"); mode=getArguments().getString("mode"); content=getArguments().getString("content");
        if (state != null) return;
        Intent intent=new Intent("create".equals(mode) ? Intent.ACTION_CREATE_DOCUMENT : Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        if ("create".equals(mode)) intent.putExtra(Intent.EXTRA_TITLE,"Dewhaven-homestead.json");
        else { intent.setType("*/*"); intent.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/json","text/plain","application/octet-stream"}); }
        try { startActivityForResult(intent,REQUEST); } catch(Exception e) { finish("error:The system file picker could not open."); }
    }
    @Override public void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request,result,data);
        if(request!=REQUEST)return;
        if(result!=Activity.RESULT_OK||data==null||data.getData()==null){finish("cancel");return;}
        try {
            if("create".equals(mode)){
                try(OutputStream stream=getActivity().getContentResolver().openOutputStream(data.getData(),"wt")){
                    if(stream==null)throw new java.io.IOException(); stream.write(content.getBytes(StandardCharsets.UTF_8)); stream.flush();
                }
                finish("saved");
            } else {
                try(InputStream stream=getActivity().getContentResolver().openInputStream(data.getData());ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
                    if(stream==null)throw new java.io.IOException();byte[] buffer=new byte[4096];int n;
                    while((n=stream.read(buffer))!=-1){if(bytes.size()+n>250000)throw new java.io.IOException("Choose a save smaller than 250 KB.");bytes.write(buffer,0,n);}
                    finish(new String(bytes.toByteArray(),StandardCharsets.UTF_8));
                }
            }
        }catch(Exception e){finish("error:The file could not be read or written. Your existing homestead is kept.");}
    }
    private void finish(String value){UnityPlayer.UnitySendMessage(receiver,"OnFile",value);if(getFragmentManager()!=null)getFragmentManager().beginTransaction().remove(this).commitAllowingStateLoss();}
}
