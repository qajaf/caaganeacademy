CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  week_label text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.student_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.student_group_members (
  group_id uuid NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
CREATE TABLE public.course_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

GRANT SELECT ON public.exams TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_requests TO authenticated;
GRANT ALL ON public.exams, public.exam_questions, public.exam_attempts, public.student_groups, public.student_group_members, public.course_requests TO service_role;

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage exams" ON public.exams FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "students view exams of their courses" ON public.exams FOR SELECT TO authenticated USING (is_published AND public.has_course_access(auth.uid(), course_id));
-- Students never read exam_questions directly (correct answers hidden); they use get_exam_questions()
CREATE POLICY "admins manage questions" ON public.exam_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins view attempts" ON public.exam_attempts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "students view own attempts" ON public.exam_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage groups" ON public.student_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage group members" ON public.student_group_members FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "students view own membership" ON public.student_group_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage requests" ON public.course_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "students view own requests" ON public.course_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "students create own requests" ON public.course_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE OR REPLACE FUNCTION public.get_exam_questions(_exam_id uuid)
RETURNS TABLE (id uuid, question text, options jsonb, order_index integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.id, q.question, q.options, q.order_index
  FROM public.exam_questions q JOIN public.exams e ON e.id = q.exam_id
  WHERE q.exam_id = _exam_id AND e.is_published AND public.has_course_access(auth.uid(), e.course_id)
  ORDER BY q.order_index, q.created_at
$$;

CREATE OR REPLACE FUNCTION public.submit_exam(_exam_id uuid, _answers jsonb)
RETURNS public.exam_attempts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _course uuid; _results jsonb := '[]'::jsonb; _score int := 0; _total int := 0; q record; _ans int; _row public.exam_attempts;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT course_id INTO _course FROM public.exams WHERE id = _exam_id AND is_published;
  IF _course IS NULL OR NOT public.has_course_access(auth.uid(), _course) THEN RAISE EXCEPTION 'No access'; END IF;
  FOR q IN SELECT * FROM public.exam_questions WHERE exam_id = _exam_id ORDER BY order_index, created_at LOOP
    _total := _total + 1;
    _ans := NULLIF(_answers ->> q.id::text, '')::int;
    IF _ans = q.correct_index THEN _score := _score + 1; END IF;
    _results := _results || jsonb_build_object('question_id', q.id, 'question', q.question, 'options', q.options,
      'selected', _ans, 'correct', q.correct_index, 'is_correct', _ans IS NOT DISTINCT FROM q.correct_index);
  END LOOP;
  INSERT INTO public.exam_attempts (exam_id, user_id, answers, results, score, total)
  VALUES (_exam_id, auth.uid(), _answers, _results, _score, _total) RETURNING * INTO _row;
  RETURN _row;
END $$;
GRANT EXECUTE ON FUNCTION public.get_exam_questions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exam(uuid, jsonb) TO authenticated;

-- Approving a request grants course access and notifies the student
CREATE OR REPLACE FUNCTION public.handle_course_request_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text;
BEGIN
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title INTO _title FROM public.courses WHERE id = NEW.course_id;
    IF NEW.status = 'approved' THEN
      UPDATE public.student_course_access SET is_approved = true WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
      IF NOT FOUND THEN
        INSERT INTO public.student_course_access (user_id, course_id, is_approved) VALUES (NEW.user_id, NEW.course_id, true);
      END IF;
      INSERT INTO public.notifications (user_id, title, message) VALUES (NEW.user_id, 'Koorsada waa laguu oggolaaday', 'Codsigaaga koorsada "' || coalesce(_title,'') || '" waa la oggolaaday. Hadda waad daawan kartaa.');
    ELSIF NEW.status = 'rejected' THEN
      UPDATE public.student_course_access SET is_approved = false WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
      INSERT INTO public.notifications (user_id, title, message) VALUES (NEW.user_id, 'Codsiga koorsada', 'Codsigaaga koorsada "' || coalesce(_title,'') || '" lama oggolaan. La xiriir admin-ka WhatsApp.');
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_course_request_decision BEFORE UPDATE ON public.course_requests FOR EACH ROW EXECUTE FUNCTION public.handle_course_request_decision();

-- New users: profile, role (admin for the academy owner), free courses
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, is_approved, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), NEW.email, true, NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  IF lower(NEW.email) = 'qajaf69@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  INSERT INTO public.student_course_access (user_id, course_id, is_approved)
  SELECT NEW.id, c.id, true FROM public.courses c WHERE c.is_free = true;
  RETURN NEW;
END $$;