package com.example.fleet_track.archives;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.util.Base64;

public class hs256_generator {public static void main(String[] args) throws Exception {
    KeyGenerator keyGen = KeyGenerator.getInstance("HmacSHA256");
    keyGen.init(256); // 256-bit
    SecretKey secretKey = keyGen.generateKey();
    System.out.println(Base64.getEncoder().encodeToString(secretKey.getEncoded()));
}

}
