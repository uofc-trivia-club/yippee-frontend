import SignIn from '../components/user/SignIn';
import styles from './Resources.module.css';

export default function SignInPage() {
  return (
    <div className={styles.container}>
      <SignIn />
    </div>
  );
}