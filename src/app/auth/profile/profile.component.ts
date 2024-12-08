import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { UserProfile } from 'src/app/types/user';
import { AuthService } from '../auth.service';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { UserStatsService } from '../user-stats.service';
import { TaskService } from 'src/app/task/task.service';
import { Task } from 'src/app/types/task';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  userId: string | null = '';
  userData$: Observable<UserProfile | null> | undefined;
  data: object = {};
  isEditing = false;
  profileForm!: FormGroup;
  section = 'profile';

  lastEditedTask$: Observable<Task | null> | null = null;

  numOfTasks$!: Observable<number>;
  numOfTasksSaved$!: Observable<number>;
  numOfTasksSavedByOthers$!: Observable<number>;
  numOfPublishedTasks$!: Observable<number>;
  numberOfBoards$!: Observable<number>;

  constructor(
    private firestore: AngularFirestore,
    private auth: AuthService,
    private afAuth: AngularFireAuth,
    private fb: FormBuilder,
    private userStatsService: UserStatsService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('Initializing Profile Component...');

    this.profileForm = this.fb.group({
      displayName: [''],
      firstName: [''],
      lastName: [''],
      address: [''],
      profilePicture: [''],
      defBoardBckgr: [''],
      numberOfTasks: [{ value: '', disabled: true }],
      numberOfTasksSaved: [{ value: '', disabled: true }],
      numberOfTasksSavedByOthers: [{ value: '', disabled: true }],
      numberOfPublishedTasks: [{ value: '', disabled: true }],
      numberOfBoards: [{ value: '', disabled: true }],
    });

    this.auth.getUserId().subscribe((userId) => {
      console.log('User ID:', userId);
      this.userId = userId;

      if (userId) {
        this.numOfTasks$ = this.userStatsService.getUserOwnedTaskCount();
        this.numOfTasksSaved$ = this.userStatsService.getUserSavedTaskCount();
        this.numOfTasksSavedByOthers$ =
          this.userStatsService.getUserTasksSavedByOthersCount();
        this.numOfPublishedTasks$ =
          this.userStatsService.getUserPublishedTasksCount();
        this.numberOfBoards$ = this.userStatsService.getUserCreatedBoardCount();

        this.numOfTasks$.subscribe((count) => {
          this.profileForm.patchValue({ numberOfTasks: count });
        });

        this.numOfTasksSaved$.subscribe((count) => {
          this.profileForm.patchValue({ numberOfTasksSaved: count });
        });

        this.numOfTasksSavedByOthers$.subscribe((count) => {
          this.profileForm.patchValue({ numberOfTasksSavedByOthers: count });
        });

        this.numOfPublishedTasks$.subscribe((count) => {
          this.profileForm.patchValue({ numberOfPublishedTasks: count });
        });

        this.numberOfBoards$.subscribe((count) => {
          this.profileForm.patchValue({ numberOfBoards: count });
        });
      }

      this.lastEditedTask$ = this.taskService.getLastEditedTask(
        userId as string
      );
      this.lastEditedTask$.subscribe((task) => {
        console.log('--- Last edited task in profile:', task);
      });
      this.cdr.detectChanges();
    });

    // patch form with user data -
    this.userData$ = this.auth.getUserId().pipe(
      switchMap((userId) => {
        console.log('SwitchMap triggered with userId:', userId);
        if (userId) {
          return this.firestore
            .collection('users')
            .doc<UserProfile>(userId)
            .valueChanges()
            .pipe(
              map((userData) => {
                console.log('Fetched User Data from Firestore:', userData);
                return userData ?? null;
              }),
              tap((userData) => {
                if (userData) {
                  console.log('Patching form with user data:', userData);
                  this.profileForm.patchValue({
                    displayName: userData.displayName,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    address: userData.address,
                    profilePicture: userData.profilePicture,
                    defBoardBckgr: userData.defBoardBckgr,
                  });
                } else {
                  console.warn('No user data found');
                }
              })
            );
        } else {
          console.warn('No User ID found, returning null');
          return of(null);
        }
      })
    );

    // for loggging -
    this.userData$.subscribe((userData) => {
      console.log('userData$ observable emitted:', userData);
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;

    // form populate -
    if (this.isEditing && this.userData$) {
      this.userData$.subscribe((user) => {
        if (user) {
          this.profileForm.patchValue({
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            address: user.address,
            profilePicture: user.profilePicture,
            defBoardBckgr: user.defBoardBckgr,
          });
        }
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid && this.userId) {
      const updatedData: Partial<UserProfile> = this.profileForm.value;

      this.auth
        .updateUserProfile(this.userId, updatedData)
        .then(() => {
          console.log('Profile updated successfully');
          this.isEditing = false;
        })
        .catch((error) => {
          console.error('Error updating profile:', error);
        });
    }
  }
}
