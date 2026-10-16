# Caagane Academy — qorshaha cusub

## 1. Tirtirid & admin
- Tirtir dhammaan ardayda hadda jira (koontooyinka, horumarka, qoraallada, codsiyada). Koorsooyinka, playlist-yada iyo casharada way harayaan.
- Qajaf69@gmail.com si toos ah ayuu admin u noqonayaa marka uu Google ku soo galo.

## 2. Gelitaanka — Google oo kaliya
- Bogagga "Gal" iyo "Isdiiwaangali" waxay noqonayaan hal badhan: "Ku gal Google".
- Foomka email/password waa la saarayaa.
- Ardayga cusub wuxuu doortaa koorsada uu rabo (codsi).

## 3. Codsiga koorsada
- Ardaygu wuxuu codsanayaa koorso → admin-ku wuxuu arkaa liiska codsiyada → Oggolow / Diid.
- Marka la oggolaado, koorsadu si toos ah ayay ugu furmaysaa ardayga.
- Ardayga waxaa loo dirayaa email (oggolaansho ama diidmo) + ogeysiis website-ka gudihiisa.
- Koorsooyinka FREE-ga ah weli si toos ah ayay u furmayaan.

## 4. Kooxaha ardayda
- Admin-ku wuxuu sameeyaa kooxo (Ardayda-01, Ardayda-02...) wuxuuna ku daraa ardayda.
- Ogeysiis cusub: dooro koox (ama arday gaar ah) → fariinta website-ka gudihiisa + email ayaa qof walba loo dirayaa.

## 5. Imtixaanka toddobaadlaha ah (koorso kasta)
- Admin: abuur imtixaan (cinwaan, koorso, toddobaad), ku dar su'aalo badan oo doorasho leh (A/B/C/D) + jawaabta saxda ah; wax ka beddel / tirtir.
- Arday: wuxuu arkaa imtixaannada koorsooyinka uu fasaxa u haysto → ka jawaab → "Gudbi".
- Kadib: dhibcaha, su'aalihii uu qalday iyo jawaabta saxda ah.
- Natiijooyinka waxaa lagu kaydinayaa qaybta "Imtixaannada" (ardayga iyo admin-ka labadaba way arkaan).

## 6. Mobile / tablet / desktop
- Dib u eegis bog walba (Courses, Dashboard, Admin, Imtixaan) si uu ugu fiicnaado shaashadaha yaryar; admin sidebar wuxuu noqonayaa menu la furo mobile-ka.

## Waxa aad u baahan tahay (email)
- Emailka waxaa lagu dirayaa **Resend** sidaad dooratay. Email Gmail ah (tusaale @gmail.com) ma noqon karo cidda diraysa — Resend wuxuu u baahan yahay domain aad leedahay oo la xaqiijiyay si emailku u gaaro ardayda. Inta aan domain lahayn, emailku wuxuu gaarayaa oo kaliya milkiilaha koontada Resend; ogeysiisyada website-ka gudihiisa way shaqaynayaan.

## Technical details
- Tables: `exams`, `exam_questions` (options jsonb, correct_index), `exam_attempts` (answers jsonb, score), `student_groups`, `student_group_members`, `course_requests` (status pending/approved/rejected). GRANT + RLS: admins via `has_role`, students own rows; correct answers hidden from students (grading in edge function or security-definer RPC `submit_exam`).
- Trigger on `auth.users`: assign `admin` role when email = Qajaf69@gmail.com.
- Google provider via `configure_social_auth`; disable email provider after Google works.
- Edge function `send-student-email` (Resend via gateway, admin-only), used for request decisions and group notices (one email per recipient).
- Delete users through admin auth API (cascades profiles/roles; clear student tables).
