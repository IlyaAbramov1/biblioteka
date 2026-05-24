import styles from "./CanvasLogo.module.css";

export default function CanvasLogo() {
    return (
        <span className={styles.logo} aria-hidden="true">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="35"
                height="55"
                viewBox="0 0 35 55"
                fill="none"
            >
                <path
                    d="M0 52.6577V2C0 0.895431 0.89543 0 2 0H33C34.1046 0 35 0.895432 35 2V52.6577C35 54.5068 32.706 55.3656 31.4917 53.9711L19.0083 39.6352C18.2111 38.7197 16.7889 38.7197 15.9917 39.6352L3.5083 53.9711C2.294 55.3656 0 54.5068 0 52.6577Z"
                    fill="#0079FF"
                />
            </svg>
        </span>
    );
}
