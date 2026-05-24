import styles from "./CanvasLogo.module.css";

export default function CanvasLogo() {
    return (
        <span className={styles.logo} aria-hidden="true">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="35"
                height="37"
                viewBox="0 0 35 37"
                fill="none"
            >
                <path
                    d="M0 34.6577V-16C0 -17.1046 0.89543 -18 2 -18H33C34.1046 -18 35 -17.1046 35 -16V34.6577C35 36.5068 32.706 37.3656 31.4917 35.9711L19.0083 21.6352C18.2111 20.7197 16.7889 20.7197 15.9917 21.6352L3.5083 35.9711C2.294 37.3656 0 36.5068 0 34.6577Z"
                    fill="#0079FF"
                />
            </svg>
        </span>
    );
}
