import { Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { User, UserProfile } from '../types/user';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  @Output() logged = new EventEmitter<void>();

  private isLogged$$ = new BehaviorSubject<boolean>(false);
  isLogged$ = this.isLogged$$.asObservable();

  private user$$ = new BehaviorSubject<User | null>(null);
  user$ = this.user$$.asObservable();

  get isLogged(): boolean {
    return this.isLogged$$.value;
  }

  user: User | null = null;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {
    this.afAuth.authState.subscribe((user) => {
      this.isLogged$$.next(!!user);
      this.user = user
        ? { uid: user.uid, email: user.email, displayName: user.displayName }
        : null;

      this.user$$.next(user);
    });
  }

  async reg(username: string, email: string, password: string): Promise<any> {
    const userCredential = await this.afAuth.createUserWithEmailAndPassword(
      email,
      password
    );

    if (userCredential.user) {
      await userCredential.user.updateProfile({
        displayName: username,
      });

      const newUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: username,
        firstName: '',
        lastName: '',
        address: '',
        profilePicture: '',
        defBoardBckgr: '',
      };

      await this.firestore.collection('users').doc(newUser.uid).set(newUser);
    }
  }

  updateUserProfile(uid: string, userData: Partial<User>): Promise<void> {
    return this.firestore.collection('users').doc(uid).update(userData);
  }

  log(email: string, password: string): Promise<any> {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        this.user = userCredential.user;

        this.user$$.next(userCredential.user);

        this.isLogged$$.next(true);
        // this.logged.emit();
      });
  }

  logout(): Promise<void> {
    return this.afAuth.signOut().then(() => {
      this.user = null;
      this.isLogged$$.next(false);
      this.router.navigate(['/wall']);
    });
  }

  getUser(): Observable<User | null> {
    // return this.afAuth.authState;
    return this.user$;
  }

  getUserId(): Observable<string | null> {
    return this.afAuth.authState.pipe(map((user) => (user ? user.uid : null)));
  }

  getUserDataById(userId: string): Observable<UserProfile | undefined> {
    return this.firestore
      .collection('users')
      .doc<UserProfile>(userId)
      .valueChanges();
  }

  getCurrentUserId(): string | null {
    return this.user$$.value ? this.user$$.value.uid : null;
  }

  // auto unsubscr - without making new obs with .subscr -
  isAuthenticated(): Observable<boolean> {
    // return this.afAuth.authState.pipe(map((user) => !!user));
    return this.isLogged$;
  }

  //

  updateDefaultBoardImage(
    userId: string,
    imageUrl: string | null
  ): Promise<void> {
    return this.firestore
      .collection('users')
      .doc(userId)
      .update({ defBoardBckgr: imageUrl })
      .catch((error) => {
        console.error('error updating default board image:', error);
      });
  }

  getDefaultBoardImage(userId: string): Observable<string | null> {
    return this.firestore
      .collection('users')
      .doc(userId)
      .valueChanges()
      .pipe(map((userData: any) => userData?.defBoardBckgr || null));
  }
}
